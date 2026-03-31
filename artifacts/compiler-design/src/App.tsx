import { useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// GRAMMAR
// ─────────────────────────────────────────────────────────────────────────────

const GRAMMAR: Record<string, string[][]> = {
  program:       [["BEGIN", "stmt_list", "END"]],
  stmt_list:     [["stmt", "stmt_list"], ["ε"]],
  stmt:          [["PRINT", "expr", ";"], ["declaration"], ["assignment"], ["for_loop"]],
  declaration:   [["type", "var_list", ";"]],
  type:          [["INTEGER"], ["REAL"], ["STRING"]],
  var_list:      [["IDENTIFIER", "var_list_tail"]],
  var_list_tail: [[",", "IDENTIFIER", "var_list_tail"], ["ε"]],
  assignment:    [["IDENTIFIER", ":=", "expr", ";"]],
  for_loop:      [["FOR", "IDENTIFIER", ":=", "expr", "TO", "expr", "stmt_list", "END"]],
  expr:          [["IDENTIFIER"], ["NUMBER"], ["STRING"]],
};

const NON_TERMINALS = Object.keys(GRAMMAR);
const KEYWORDS = new Set(["BEGIN", "PRINT", "INTEGER", "REAL", "STRING", "FOR", "TO", "END"]);

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Token { type: string; lexeme: string; id: number; }
interface LexResult {
  tokens: Token[];
  tokenStream: string[];
  keywords: string[];
  identifiers: string[];
  literals: string[];
  error?: string;
}
interface ParseStep { step: number; stack: string; input: string; action: string; }
interface CompilerResult {
  lexResult: LexResult;
  firstSets: Record<string, string[]>;
  followSets: Record<string, string[]>;
  parseTable: Record<string, Record<string, string[]>>;
  parseSteps: ParseStep[];
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEXER
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_SPEC: [string, RegExp][] = [
  ["KEYWORD",    /\b(?:BEGIN|PRINT|INTEGER|REAL|STRING|FOR|TO|END)\b/y],
  ["NUMBER",     /-?\d+\.?\d*(?:[Ee][+\-]?\d+)?/y],
  ["STRING",     /"[^"]*"/y],
  ["IDENTIFIER", /\b[a-zA-Z_]\w*\b/y],
  ["OPERATOR",   /:=|;|,/y],
  ["NEWLINE",    /\n/y],
  ["SKIP",       /[ \t]+/y],
];

function lex(source: string): LexResult {
  const tokens: Token[] = [];
  const tokenStream: string[] = [];
  const tokenValues: Record<string, number> = {};
  let tokenId = 1;
  const kwSet = new Set<string>(), idSet = new Set<string>(), litSet = new Set<string>();
  let pos = 0;

  while (pos < source.length) {
    let matched = false;
    for (const [name, re] of TOKEN_SPEC) {
      re.lastIndex = pos;
      const m = re.exec(source);
      if (m && m.index === pos) {
        const value = m[0];
        pos += value.length;
        matched = true;
        if (name === "SKIP" || name === "NEWLINE") break;
        let kind = name;
        if (kind === "IDENTIFIER" && KEYWORDS.has(value)) kind = "KEYWORD";
        if (!(value in tokenValues)) tokenValues[value] = tokenId++;
        tokens.push({ type: kind, lexeme: value, id: tokenValues[value] });
        if (kind === "IDENTIFIER") { tokenStream.push("IDENTIFIER"); idSet.add(value); }
        else if (kind === "NUMBER") { tokenStream.push("NUMBER"); litSet.add(value); }
        else if (kind === "STRING") { tokenStream.push("STRING"); litSet.add(value); }
        else { tokenStream.push(value); if (kind === "KEYWORD") kwSet.add(value); }
        break;
      }
    }
    if (!matched) {
      return { tokens, tokenStream, keywords: [...kwSet].sort(), identifiers: [...idSet].sort(), literals: [...litSet].sort(), error: `Unexpected character: '${source[pos]}' at position ${pos}` };
    }
  }
  tokenStream.push("$");
  return { tokens, tokenStream, keywords: [...kwSet].sort(), identifiers: [...idSet].sort(), literals: [...litSet].sort() };
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRST / FOLLOW
// ─────────────────────────────────────────────────────────────────────────────

function firstOfSym(sym: string, memo: Map<string, Set<string>>): Set<string> {
  if (!GRAMMAR[sym]) return new Set([sym]);
  if (memo.has(sym)) return memo.get(sym)!;
  const result = new Set<string>();
  memo.set(sym, result);
  for (const prod of GRAMMAR[sym]) {
    if (prod[0] === "ε") { result.add("ε"); continue; }
    let allEps = true;
    for (const s of prod) {
      const f = firstOfSym(s, memo);
      for (const x of f) if (x !== "ε") result.add(x);
      if (!f.has("ε")) { allEps = false; break; }
    }
    if (allEps) result.add("ε");
  }
  return result;
}

function firstOfSeq(seq: string[], memo: Map<string, Set<string>>): Set<string> {
  const result = new Set<string>();
  let allEps = true;
  for (const sym of seq) {
    const f = firstOfSym(sym, memo);
    for (const x of f) if (x !== "ε") result.add(x);
    if (!f.has("ε")) { allEps = false; break; }
  }
  if (allEps) result.add("ε");
  return result;
}

function computeFirst(memo: Map<string, Set<string>>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const nt of NON_TERMINALS) result[nt] = [...firstOfSym(nt, memo)].sort();
  return result;
}

function computeFollow(memo: Map<string, Set<string>>): Record<string, string[]> {
  const follow: Record<string, Set<string>> = {};
  for (const nt of NON_TERMINALS) follow[nt] = new Set();
  follow["program"].add("$");
  let changed = true;
  while (changed) {
    changed = false;
    for (const [head, prods] of Object.entries(GRAMMAR)) {
      for (const prod of prods) {
        for (let i = 0; i < prod.length; i++) {
          const B = prod[i];
          if (!GRAMMAR[B]) continue;
          const beta = prod.slice(i + 1);
          const firstBeta = beta.length ? firstOfSeq(beta, memo) : new Set(["ε"]);
          const before = follow[B].size;
          for (const t of firstBeta) if (t !== "ε") follow[B].add(t);
          if (firstBeta.has("ε")) for (const t of follow[head]) follow[B].add(t);
          if (follow[B].size > before) changed = true;
        }
      }
    }
  }
  const result: Record<string, string[]> = {};
  for (const nt of NON_TERMINALS) result[nt] = [...follow[nt]].sort();
  return result;
}

function buildParseTable(memo: Map<string, Set<string>>, follow: Record<string, string[]>): Record<string, Record<string, string[]>> {
  const table: Record<string, Record<string, string[]>> = {};
  for (const nt of NON_TERMINALS) table[nt] = {};
  for (const [head, prods] of Object.entries(GRAMMAR)) {
    for (const prod of prods) {
      const firstSet = prod[0] === "ε" ? new Set(["ε"]) : firstOfSeq(prod, memo);
      for (const t of firstSet) if (t !== "ε") table[head][t] = prod;
      if (firstSet.has("ε")) for (const t of follow[head]) table[head][t] = prod;
    }
  }
  return table;
}

function parse(tokenStream: string[], table: Record<string, Record<string, string[]>>): ParseStep[] {
  const stack = ["$", "program"];
  let ptr = 0;
  const actions: ParseStep[] = [];
  let step = 1;
  while (stack.length) {
    const top = stack[stack.length - 1];
    const current = tokenStream[ptr] ?? "$";
    const stackDisplay = stack.join(" ");
    if (top === "$" && current === "$") {
      actions.push({ step, stack: stackDisplay, input: current, action: "Parsing completed successfully!" });
      break;
    } else if (top === current) {
      actions.push({ step, stack: stackDisplay, input: current, action: `Match '${current}'` });
      stack.pop(); ptr++;
    } else if (!GRAMMAR[top]) {
      actions.push({ step, stack: stackDisplay, input: current, action: `ERROR: expected '${top}' but got '${current}'` });
      break;
    } else if (table[top]?.[current]) {
      const prod = table[top][current];
      actions.push({ step, stack: stackDisplay, input: current, action: `Apply: ${top} → ${prod.join(" ")}` });
      stack.pop();
      if (prod[0] !== "ε") for (let i = prod.length - 1; i >= 0; i--) stack.push(prod[i]);
    } else {
      actions.push({ step, stack: stackDisplay, input: current, action: `ERROR: no rule for (${top}, ${current})` });
      break;
    }
    step++;
  }
  return actions;
}

function runCompiler(source: string): CompilerResult {
  const lexResult = lex(source);
  const memo = new Map<string, Set<string>>();
  for (const nt of NON_TERMINALS) firstOfSym(nt, memo);
  const firstSets = computeFirst(memo);
  const followSets = computeFollow(memo);
  const parseTable = buildParseTable(memo, followSets);
  if (lexResult.error) return { lexResult, firstSets, followSets, parseTable, parseSteps: [], success: false };
  const parseSteps = parse(lexResult.tokenStream, parseTable);
  const success = parseSteps[parseSteps.length - 1]?.action.includes("successfully") ?? false;
  return { lexResult, firstSets, followSets, parseTable, parseSteps, success };
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT PROGRAM
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SOURCE = `BEGIN
PRINT "HELLO" ;
INTEGER A, B, C ;
REAL D, E ;
STRING X, Y ;
A := 2 ;
B := 4 ;
C := 6 ;
D := -3.56E-8 ;
E := 4.567 ;
X := "text1" ;
Y := "hello there" ;
FOR I := 1 TO 5
PRINT "Strings are [X] and [Y]" ;
END
END`;

// ─────────────────────────────────────────────────────────────────────────────
// STYLES / HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_BADGE: Record<string, string> = {
  KEYWORD:    "bg-blue-100 text-blue-800 border border-blue-200",
  IDENTIFIER: "bg-green-100 text-green-800 border border-green-200",
  NUMBER:     "bg-purple-100 text-purple-800 border border-purple-200",
  STRING:     "bg-amber-100 text-amber-800 border border-amber-200",
  OPERATOR:   "bg-rose-100 text-rose-800 border border-rose-200",
};

const NT_COLOR: Record<string, string> = {
  program: "text-blue-600", stmt_list: "text-indigo-600", stmt: "text-violet-600",
  declaration: "text-emerald-600", type: "text-teal-600", var_list: "text-cyan-600",
  var_list_tail: "text-sky-600", assignment: "text-orange-600", for_loop: "text-rose-600", expr: "text-fuchsia-600",
};

const NT_SET = new Set(NON_TERMINALS);

function actionColor(action: string) {
  if (action.includes("successfully")) return "text-emerald-700 font-semibold";
  if (action.startsWith("Apply:")) return "text-blue-700";
  if (action.startsWith("Match")) return "text-violet-700";
  if (action.startsWith("ERROR")) return "text-red-600 font-semibold";
  return "text-foreground";
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function SymbolTable({ items, label, color }: { items: string[]; label: string; color: string }) {
  if (!items.length) return <div className="px-4 py-6 text-center text-sm text-gray-400">No {label.toLowerCase()}s found</div>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="bg-gray-50 border-b border-gray-200">
        <th className="text-left px-4 py-3 font-semibold text-gray-700 w-12">#</th>
        <th className="text-left px-4 py-3 font-semibold text-gray-700">{label}</th>
      </tr></thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
            <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
            <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${color}`}>{item}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB PANELS
// ─────────────────────────────────────────────────────────────────────────────

function LexicalPanel({ result, source }: { result: CompilerResult; source: string }) {
  const [symTab, setSymTab] = useState<"keywords" | "identifiers" | "literals">("keywords");
  const { lexResult } = result;
  return (
    <div className="space-y-8">
      {/* Source */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Source Program</h2>
        <p className="text-sm text-gray-500 mb-3">Input source code currently loaded</p>
        <pre className="bg-gray-900 text-green-300 rounded-lg p-5 text-sm font-mono leading-relaxed overflow-x-auto border border-gray-800 shadow">{source}</pre>
      </section>

      {/* Token Table */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Token Table</h2>
        <p className="text-sm text-gray-500 mb-3">{lexResult.tokens.length} tokens identified by the lexical analyzer</p>
        {lexResult.error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{lexResult.error}</div>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-8">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Lexeme</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Token ID</th>
                </tr></thead>
                <tbody>
                  {lexResult.tokens.map((tok, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TOKEN_BADGE[tok.type] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>{tok.type}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sm text-gray-900">{tok.lexeme}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-blue-600 font-semibold">{tok.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Symbol Tables */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Symbol Tables</h2>
        <p className="text-sm text-gray-500 mb-3">Extracted symbols categorized by type</p>
        <div className="flex gap-2 mb-4">
          {(["keywords", "identifiers", "literals"] as const).map((tab) => (
            <button key={tab} onClick={() => setSymTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${symTab === tab ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs opacity-70">({tab === "keywords" ? lexResult.keywords.length : tab === "identifiers" ? lexResult.identifiers.length : lexResult.literals.length})</span>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {symTab === "keywords"    && <SymbolTable items={lexResult.keywords}    label="Keyword"    color="bg-blue-100 text-blue-800 border border-blue-200" />}
          {symTab === "identifiers" && <SymbolTable items={lexResult.identifiers} label="Identifier" color="bg-green-100 text-green-800 border border-green-200" />}
          {symTab === "literals"    && <SymbolTable items={lexResult.literals}    label="Literal"    color="bg-amber-100 text-amber-800 border border-amber-200" />}
        </div>
      </section>

      {/* Token Stream */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Token Stream</h2>
        <p className="text-sm text-gray-500 mb-3">Normalized token sequence passed to the parser</p>
        <div className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-1.5 border border-gray-200">
          {lexResult.tokenStream.map((t, i) => (
            <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${t === "$" ? "bg-gray-800 text-white border-gray-700" : TOKEN_BADGE[t] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>{t}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function GrammarPanel() {
  let ruleNum = 0;
  const total = NON_TERMINALS.reduce((acc, nt) => acc + GRAMMAR[nt].length, 0);

  function Sym({ sym }: { sym: string }) {
    if (NT_SET.has(sym)) return <span className={`italic font-semibold ${NT_COLOR[sym] ?? "text-gray-700"}`}>{sym}</span>;
    if (sym === "ε") return <span className="italic text-gray-400 font-semibold">ε</span>;
    return <span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-xs">{sym}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Context-Free Grammar</h2>
        <p className="text-sm text-gray-500 mb-4">LL(1) grammar — {total} production rules across {NON_TERMINALS.length} non-terminals</p>
      </div>
      <div className="grid gap-4">
        {NON_TERMINALS.map((nt) => (
          <div key={nt} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <span className={`text-base italic font-semibold ${NT_COLOR[nt] ?? "text-gray-700"}`}>{nt}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{GRAMMAR[nt].length} {GRAMMAR[nt].length === 1 ? "production" : "productions"}</span>
            </div>
            <div className="p-5 space-y-3">
              {GRAMMAR[nt].map((prod, idx) => {
                ruleNum++;
                return (
                  <div key={idx} className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono w-8 text-right shrink-0">({ruleNum})</span>
                    <span className={`italic font-semibold ${NT_COLOR[nt] ?? ""}`}>{nt}</span>
                    <span className="text-gray-400">→</span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      {prod.map((sym, si) => <Sym key={si} sym={sym} />)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2"><span className="italic font-semibold text-blue-600">program</span><span className="text-gray-500">— Non-terminal</span></div>
          <div className="flex items-center gap-2"><span className="font-mono text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-xs">BEGIN</span><span className="text-gray-500">— Terminal</span></div>
          <div className="flex items-center gap-2"><span className="italic text-gray-400 font-semibold">ε</span><span className="text-gray-500">— Epsilon (empty)</span></div>
        </div>
      </div>
    </div>
  );
}

function FirstFollowPanel({ result }: { result: CompilerResult }) {
  function SetTable({ title, subtitle, data, color }: { title: string; subtitle: string; data: { nt: string; members: string[] }[]; color: string }) {
    return (
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 w-44">Non-Terminal</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Members</th>
            </tr></thead>
            <tbody>
              {data.map(({ nt, members }) => (
                <tr key={nt} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-semibold italic text-gray-800">{nt}</td>
                  <td className="px-4 py-3">
                    {members.length === 0 ? <span className="text-gray-400 text-xs italic">empty</span> : (
                      <div className="flex flex-wrap gap-1.5">
                        {members.map((s) => <span key={s} className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${color}`}>{s}</span>)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <SetTable title="FIRST Sets" subtitle="Terminal symbols that can begin any string derived from each non-terminal"
        data={NON_TERMINALS.map((nt) => ({ nt, members: result.firstSets[nt] ?? [] }))}
        color="bg-blue-50 text-blue-700 border-blue-200" />
      <SetTable title="FOLLOW Sets" subtitle="Terminal symbols that can appear immediately after each non-terminal in some sentential form"
        data={NON_TERMINALS.map((nt) => ({ nt, members: result.followSets[nt] ?? [] }))}
        color="bg-emerald-50 text-emerald-700 border-emerald-200" />
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">How FIRST &amp; FOLLOW Are Used</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500">
          <div><p className="font-medium text-gray-800 mb-1">FIRST(A) rule:</p><p>For A → α, if the next input is in FIRST(α), apply this production.</p></div>
          <div><p className="font-medium text-gray-800 mb-1">FOLLOW(A) rule:</p><p>If α derives ε and the next input is in FOLLOW(A), apply A → α (epsilon production).</p></div>
        </div>
      </section>
    </div>
  );
}

function ParseTablePanel({ result }: { result: CompilerResult }) {
  const { parseTable } = result;
  const allTerminals = new Set<string>();
  for (const nt of NON_TERMINALS) for (const t of Object.keys(parseTable[nt] ?? {})) allTerminals.add(t);
  const preferred = ["BEGIN","PRINT","INTEGER","REAL","STRING","FOR","END","IDENTIFIER",":=","TO","NUMBER",";",",","$"];
  const terminals = [...preferred.filter((t) => allTerminals.has(t)), ...[...allTerminals].filter((t) => !preferred.includes(t)).sort()];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">LL(1) Parse Table</h2>
        <p className="text-sm text-gray-500 mb-4">Predictive parsing table computed from FIRST and FOLLOW sets. Each cell shows which production to apply for a given (non-terminal, input token) pair.</p>
      </div>
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-xs min-w-max">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-3 py-3 font-semibold border-r border-gray-700 text-left sticky left-0 bg-gray-900 z-10 min-w-36">Non-Terminal</th>
                {terminals.map((t) => (
                  <th key={t} className="px-3 py-3 font-semibold border-r border-gray-700 last:border-0 text-center min-w-24 whitespace-nowrap font-mono">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NON_TERMINALS.map((nt) => (
                <tr key={nt} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 border-r border-gray-200 font-mono font-semibold italic text-gray-800 bg-gray-50 sticky left-0 z-10 text-sm">{nt}</td>
                  {terminals.map((t) => {
                    const prod = parseTable[nt]?.[t];
                    return (
                      <td key={t} className={`px-3 py-2.5 border-r border-gray-100 last:border-0 text-center align-middle ${prod ? (prod.join(" ") === "ε" ? "text-amber-600 font-mono font-semibold" : "text-blue-700 font-mono") : "text-gray-300"}`}
                        title={prod ? `${nt} → ${prod.join(" ")}` : undefined}>
                        {prod ? prod.join(" ") : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2"><span className="text-gray-300 font-mono">—</span><span className="text-gray-500">No production (error)</span></div>
          <div className="flex items-center gap-2"><span className="text-amber-600 font-mono font-semibold">ε</span><span className="text-gray-500">Apply epsilon production</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-700 font-mono text-xs">id := e ;</span><span className="text-gray-500">Apply listed production</span></div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 25;

function ParsingActionsPanel({ result }: { result: CompilerResult }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const steps = result.parseSteps;
  const success = steps[steps.length - 1]?.action.includes("successfully") ?? false;

  const filtered = search.trim()
    ? steps.filter((a) => a.action.toLowerCase().includes(search.toLowerCase()) || a.input.toLowerCase().includes(search.toLowerCase()) || a.stack.toLowerCase().includes(search.toLowerCase()) || String(a.step).includes(search))
    : steps;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Full Parsing Actions</h2>
        <p className="text-sm text-gray-500 mb-2">LL(1) parse trace — step-by-step stack operations and reductions</p>
        <span className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${success ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          <div className={`w-2 h-2 rounded-full ${success ? "bg-emerald-500" : "bg-red-500"}`} />
          {success ? `Accepted — ${steps.length} steps` : `Parse failed — ${steps.length} steps completed`}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input type="search" placeholder="Filter steps, symbols, actions..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-72" />
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{filtered.length} steps</span>
          {search && <button onClick={() => setSearch("")} className="text-blue-600 hover:underline">Clear</button>}
        </div>
      </div>
      {steps.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">No parse steps — check for lexer errors in the Lexical Analysis tab.</div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-3 font-semibold text-gray-700 w-16">Step</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 min-w-48">Stack</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700 min-w-28">Input</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-700">Action</th>
              </tr></thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr key={row.step} className={`border-b border-gray-100 last:border-0 ${row.action.includes("successfully") ? "bg-emerald-50" : row.action.startsWith("ERROR") ? "bg-red-50" : "hover:bg-gray-50"}`}>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-400 font-semibold">{row.step}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-800 max-w-xs truncate">{row.stack}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {row.input ? <span className="bg-gray-100 border border-gray-200 text-gray-800 px-1.5 py-0.5 rounded">{row.input}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${actionColor(row.action)}`}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
          <span className="text-sm text-gray-400">Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-md border border-gray-300 text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Action Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-400" /><span className="text-gray-500">Apply production</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-violet-400" /><span className="text-gray-500">Match terminal</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-400" /><span className="text-gray-500">Success</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-400" /><span className="text-gray-500">Error</span></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "lexical" | "grammar" | "firstfollow" | "parsetable" | "actions";

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "lexical",     label: "Lexical Analysis", short: "Lexical" },
  { id: "grammar",     label: "Grammar",           short: "Grammar" },
  { id: "firstfollow", label: "FIRST / FOLLOW",    short: "FIRST/FOLLOW" },
  { id: "parsetable",  label: "Parse Table",        short: "Parse Table" },
  { id: "actions",     label: "Parsing Actions",    short: "Actions" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("lexical");
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [draft, setDraft] = useState(DEFAULT_SOURCE);
  const [result, setResult] = useState<CompilerResult>(() => runCompiler(DEFAULT_SOURCE));
  const [panelOpen, setPanelOpen] = useState(false);

  const handleRun = useCallback(() => {
    setResult(runCompiler(draft));
    setSource(draft);
    setPanelOpen(false);
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleRun();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium tracking-widest uppercase mb-0.5">NMAM Institute of Technology, Nitte</p>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">Compiler Design Mini Project</h1>
            <p className="text-sm text-gray-400 mt-0.5">Designing a Compiler for a Hypothetical Language</p>
          </div>
          <button onClick={() => setPanelOpen((v) => !v)}
            className="shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors shadow">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Program
          </button>
        </div>
      </header>

      {/* Edit Panel */}
      {panelOpen && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Source Program</p>
                <p className="text-xs text-gray-500">
                  Write a program using the hypothetical language. Statements need <code className="bg-gray-100 px-1 rounded font-mono">;</code>.
                  Press <kbd className="bg-gray-100 border border-gray-300 px-1 py-0.5 rounded text-xs font-mono">Ctrl+Enter</kbd> to compile.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDraft(DEFAULT_SOURCE)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">Reset</button>
                <button onClick={handleRun}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 font-medium shadow-sm">Compile</button>
              </div>
            </div>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={handleKeyDown}
              spellCheck={false} rows={14}
              className="w-full font-mono text-sm bg-gray-900 text-green-300 rounded-lg p-4 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-relaxed" />
            {result.lexResult.error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {result.lexResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status bar */}
      {!panelOpen && (
        <div className={`border-b px-4 sm:px-6 py-2 text-xs flex items-center gap-3 ${result.success ? "bg-emerald-50 border-emerald-200 text-emerald-700" : result.lexResult.error ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          <div className={`w-2 h-2 rounded-full ${result.success ? "bg-emerald-500" : result.lexResult.error ? "bg-red-500" : "bg-amber-500"}`} />
          {result.success ? `Compiled successfully — ${result.lexResult.tokens.length} tokens, ${result.parseSteps.length} parse steps` : result.lexResult.error ? result.lexResult.error : "Parse error — check program syntax"}
          <span className="ml-auto text-current/60 font-mono truncate max-w-xs hidden sm:block">{source.split("\n")[0]}…</span>
        </div>
      )}

      {/* Tab Bar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${activeTab === tab.id ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-800"}`}>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === "lexical"     && <LexicalPanel result={result} source={source} />}
        {activeTab === "grammar"     && <GrammarPanel />}
        {activeTab === "firstfollow" && <FirstFollowPanel result={result} />}
        {activeTab === "parsetable"  && <ParseTablePanel result={result} />}
        {activeTab === "actions"     && <ParsingActionsPanel result={result} />}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        Compiler Design Mini Project — NMAM Institute of Technology, Nitte
      </footer>
    </div>
  );
}
