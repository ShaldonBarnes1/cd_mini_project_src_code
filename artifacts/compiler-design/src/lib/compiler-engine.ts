// =====================================================================
// Compiler Engine — TypeScript port of the Python compiler design project
// Implements: Lexer, FIRST/FOLLOW computation, Parse Table, LL(1) Parser
// =====================================================================

// ── Grammar definition ────────────────────────────────────────────────

export const GRAMMAR: Record<string, string[][]> = {
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

export const NON_TERMINALS = Object.keys(GRAMMAR);

const KEYWORDS = new Set(["BEGIN", "PRINT", "INTEGER", "REAL", "STRING", "FOR", "TO", "END"]);

// ── Lexer ─────────────────────────────────────────────────────────────

export interface Token {
  type: string;
  lexeme: string;
  id: number;
}

export interface LexResult {
  tokens: Token[];
  tokenStream: string[];
  keywords: string[];
  identifiers: string[];
  literals: string[];
  error?: string;
}

const TOKEN_SPEC: [string, RegExp][] = [
  ["KEYWORD",    /\b(?:BEGIN|PRINT|INTEGER|REAL|STRING|FOR|TO|END)\b/y],
  ["NUMBER",     /-?\d+\.?\d*(?:[Ee][+\-]?\d+)?/y],
  ["STRING",     /"[^"]*"/y],
  ["IDENTIFIER", /\b[a-zA-Z_]\w*\b/y],
  ["OPERATOR",   /:=|;|,/y],
  ["NEWLINE",    /\n/y],
  ["SKIP",       /[ \t]+/y],
];

export function lex(source: string): LexResult {
  const tokens: Token[] = [];
  const tokenStream: string[] = [];
  const tokenValues: Record<string, number> = {};
  let tokenId = 1;

  const kwSet = new Set<string>();
  const idSet = new Set<string>();
  const litSet = new Set<string>();

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

        if (!(value in tokenValues)) {
          tokenValues[value] = tokenId++;
        }

        tokens.push({ type: kind, lexeme: value, id: tokenValues[value] });

        if (kind === "IDENTIFIER") {
          tokenStream.push("IDENTIFIER");
          idSet.add(value);
        } else if (kind === "NUMBER") {
          tokenStream.push("NUMBER");
          litSet.add(value);
        } else if (kind === "STRING") {
          tokenStream.push("STRING");
          litSet.add(value);
        } else {
          tokenStream.push(value);
          if (kind === "KEYWORD") kwSet.add(value);
        }
        break;
      }
    }
    if (!matched) {
      return {
        tokens,
        tokenStream,
        keywords: [...kwSet].sort(),
        identifiers: [...idSet].sort(),
        literals: [...litSet].sort(),
        error: `Unexpected character: '${source[pos]}' at position ${pos}`,
      };
    }
  }

  tokenStream.push("$");

  return {
    tokens,
    tokenStream,
    keywords: [...kwSet].sort(),
    identifiers: [...idSet].sort(),
    literals: [...litSet].sort(),
  };
}

// ── FIRST / FOLLOW ────────────────────────────────────────────────────

function firstOfSymbol(sym: string, memo: Map<string, Set<string>>): Set<string> {
  if (!GRAMMAR[sym]) return new Set([sym]);
  if (memo.has(sym)) return memo.get(sym)!;

  const result = new Set<string>();
  memo.set(sym, result);

  for (const prod of GRAMMAR[sym]) {
    if (prod[0] === "ε") {
      result.add("ε");
    } else {
      let allHaveEps = true;
      for (const s of prod) {
        const f = firstOfSymbol(s, memo);
        for (const x of f) if (x !== "ε") result.add(x);
        if (!f.has("ε")) { allHaveEps = false; break; }
      }
      if (allHaveEps) result.add("ε");
    }
  }

  return result;
}

export function computeFirst(): Record<string, string[]> {
  const memo = new Map<string, Set<string>>();
  const result: Record<string, string[]> = {};
  for (const nt of NON_TERMINALS) {
    result[nt] = [...firstOfSymbol(nt, memo)].sort();
  }
  return result;
}

function firstOfSequence(seq: string[], memo: Map<string, Set<string>>): Set<string> {
  const result = new Set<string>();
  let allHaveEps = true;
  for (const sym of seq) {
    const f = firstOfSymbol(sym, memo);
    for (const x of f) if (x !== "ε") result.add(x);
    if (!f.has("ε")) { allHaveEps = false; break; }
  }
  if (allHaveEps) result.add("ε");
  return result;
}

export function computeFollow(firstMemo: Map<string, Set<string>>): Record<string, string[]> {
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
          const firstBeta = beta.length ? firstOfSequence(beta, firstMemo) : new Set(["ε"]);
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

// ── Parse Table ───────────────────────────────────────────────────────

export type ParseTable = Record<string, Record<string, string[]>>;

export function buildParseTable(firstMemo: Map<string, Set<string>>, follow: Record<string, string[]>): ParseTable {
  const table: ParseTable = {};
  for (const nt of NON_TERMINALS) table[nt] = {};

  for (const [head, prods] of Object.entries(GRAMMAR)) {
    for (const prod of prods) {
      const firstSet = firstOfSequence(prod[0] === "ε" ? [] : prod, firstMemo);
      if (prod[0] === "ε") firstSet.add("ε");

      for (const t of firstSet) {
        if (t !== "ε") table[head][t] = prod;
      }
      if (firstSet.has("ε")) {
        for (const t of follow[head]) {
          table[head][t] = prod;
        }
      }
    }
  }

  return table;
}

// ── LL(1) Parser ──────────────────────────────────────────────────────

export interface ParseStep {
  step: number;
  stack: string;
  input: string;
  action: string;
}

export function parse(tokenStream: string[], table: ParseTable): ParseStep[] {
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
      stack.pop();
      ptr++;
    } else if (!GRAMMAR[top]) {
      actions.push({ step, stack: stackDisplay, input: current, action: `ERROR: expected '${top}' but got '${current}'` });
      break;
    } else if (table[top]?.[current]) {
      const prod = table[top][current];
      actions.push({ step, stack: stackDisplay, input: current, action: `Apply: ${top} → ${prod.join(" ")}` });
      stack.pop();
      if (prod[0] !== "ε") {
        for (let i = prod.length - 1; i >= 0; i--) stack.push(prod[i]);
      }
    } else {
      actions.push({ step, stack: stackDisplay, input: current, action: `ERROR: no rule for (${top}, ${current})` });
      break;
    }

    step++;
  }

  return actions;
}

// ── Main entry point ──────────────────────────────────────────────────

export interface CompilerResult {
  lexResult: LexResult;
  firstSets: Record<string, string[]>;
  followSets: Record<string, string[]>;
  parseTable: ParseTable;
  parseSteps: ParseStep[];
  success: boolean;
}

export function runCompiler(source: string): CompilerResult {
  const lexResult = lex(source);

  const firstMemo = new Map<string, Set<string>>();
  for (const nt of NON_TERMINALS) firstOfSymbol(nt, firstMemo);

  const firstSets = computeFirst();
  const followSets = computeFollow(firstMemo);
  const parseTable = buildParseTable(firstMemo, followSets);

  if (lexResult.error) {
    return { lexResult, firstSets, followSets, parseTable, parseSteps: [], success: false };
  }

  const parseSteps = parse(lexResult.tokenStream, parseTable);
  const lastAction = parseSteps[parseSteps.length - 1]?.action ?? "";
  const success = lastAction.includes("successfully");

  return { lexResult, firstSets, followSets, parseTable, parseSteps, success };
}
