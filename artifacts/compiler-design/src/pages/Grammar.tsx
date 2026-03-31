import { GRAMMAR } from "@/data/compiler-data";

const NT_COLORS: Record<string, string> = {
  program: "text-blue-600 font-bold",
  stmt_list: "text-indigo-600 font-bold",
  stmt: "text-violet-600 font-bold",
  declaration: "text-emerald-600 font-bold",
  type: "text-teal-600 font-bold",
  var_list: "text-cyan-600 font-bold",
  var_list_tail: "text-sky-600 font-bold",
  assignment: "text-orange-600 font-bold",
  for_loop: "text-rose-600 font-bold",
  expr: "text-fuchsia-600 font-bold",
};

const NON_TERMINALS = new Set([
  "program","stmt_list","stmt","declaration","type",
  "var_list","var_list_tail","assignment","for_loop","expr",
]);

function renderSymbol(sym: string) {
  if (NON_TERMINALS.has(sym)) {
    return (
      <span key={sym} className={`italic ${NT_COLORS[sym] ?? "text-foreground"}`}>
        {sym}
      </span>
    );
  }
  if (sym === "ε") {
    return <span key="eps" className="text-muted-foreground italic font-semibold">ε</span>;
  }
  return <span key={sym} className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-xs">{sym}</span>;
}

export default function Grammar() {
  let ruleNum = 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Context-Free Grammar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          LL(1) grammar for the hypothetical language — {GRAMMAR.reduce((acc, r) => acc + r.productions.length, 0)} production rules
        </p>
      </div>

      <div className="grid gap-4">
        {GRAMMAR.map((rule) => (
          <div key={rule.nonTerminal} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center gap-3">
              <span className={`text-base ${NT_COLORS[rule.nonTerminal] ?? "text-foreground"} italic`}>
                {rule.nonTerminal}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {rule.productions.length} {rule.productions.length === 1 ? "production" : "productions"}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {rule.productions.map((prod, idx) => {
                ruleNum++;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-8 shrink-0 text-right">
                      ({ruleNum})
                    </span>
                    <span className={`italic ${NT_COLORS[rule.nonTerminal] ?? ""}`}>
                      {rule.nonTerminal}
                    </span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      {prod.map((sym, si) => (
                        <span key={si}>{renderSymbol(sym)}</span>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="italic text-blue-600 font-bold">program</span>
            <span className="text-muted-foreground">— Non-terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs">BEGIN</span>
            <span className="text-muted-foreground">— Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="italic text-muted-foreground font-semibold">ε</span>
            <span className="text-muted-foreground">— Empty string</span>
          </div>
        </div>
      </div>
    </div>
  );
}
