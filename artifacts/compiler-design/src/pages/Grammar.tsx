import { GRAMMAR, NON_TERMINALS } from "@/lib/compiler-engine";

const NT_COLORS: Record<string, string> = {
  program:       "text-blue-600 font-bold",
  stmt_list:     "text-indigo-600 font-bold",
  stmt:          "text-violet-600 font-bold",
  declaration:   "text-emerald-600 font-bold",
  type:          "text-teal-600 font-bold",
  var_list:      "text-cyan-600 font-bold",
  var_list_tail: "text-sky-600 font-bold",
  assignment:    "text-orange-600 font-bold",
  for_loop:      "text-rose-600 font-bold",
  expr:          "text-fuchsia-600 font-bold",
};

const NT_SET = new Set(NON_TERMINALS);

function renderSymbol(sym: string, key: number) {
  if (NT_SET.has(sym)) {
    return (
      <span key={key} className={`italic ${NT_COLORS[sym] ?? "text-foreground"}`}>
        {sym}
      </span>
    );
  }
  if (sym === "ε") {
    return <span key={key} className="text-muted-foreground italic font-semibold">ε</span>;
  }
  return (
    <span key={key} className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-xs">
      {sym}
    </span>
  );
}

export default function Grammar() {
  const totalProductions = NON_TERMINALS.reduce((acc, nt) => acc + GRAMMAR[nt].length, 0);
  let ruleNum = 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Context-Free Grammar</h2>
        <p className="text-sm text-muted-foreground mb-4">
          LL(1) grammar for the hypothetical language — {totalProductions} production rules across {NON_TERMINALS.length} non-terminals
        </p>
      </div>

      <div className="grid gap-4">
        {NON_TERMINALS.map((nt) => (
          <div key={nt} className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center gap-3">
              <span className={`text-base ${NT_COLORS[nt] ?? "text-foreground"} italic`}>{nt}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {GRAMMAR[nt].length} {GRAMMAR[nt].length === 1 ? "production" : "productions"}
              </span>
            </div>
            <div className="p-5 space-y-3">
              {GRAMMAR[nt].map((prod, idx) => {
                ruleNum++;
                return (
                  <div key={idx} className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-muted-foreground font-mono w-8 shrink-0 text-right">
                      ({ruleNum})
                    </span>
                    <span className={`italic ${NT_COLORS[nt] ?? ""}`}>{nt}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      {prod.map((sym, si) => renderSymbol(sym, si))}
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
            <span className="text-muted-foreground">— Empty string (epsilon)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
