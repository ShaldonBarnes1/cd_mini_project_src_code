import type { CompilerResult } from "@/lib/compiler-engine";
import { NON_TERMINALS } from "@/lib/compiler-engine";

export default function ParseTable({ result }: { result: CompilerResult }) {
  const { parseTable } = result;

  const allTerminals = new Set<string>();
  for (const nt of NON_TERMINALS) {
    for (const t of Object.keys(parseTable[nt] ?? {})) {
      allTerminals.add(t);
    }
  }

  const preferredOrder = ["BEGIN","PRINT","INTEGER","REAL","STRING","FOR","END","IDENTIFIER",":=","TO","NUMBER",";",",","$"];
  const terminals = [
    ...preferredOrder.filter((t) => allTerminals.has(t)),
    ...[...allTerminals].filter((t) => !preferredOrder.includes(t)).sort(),
  ];

  function cellClass(val: string | undefined) {
    if (!val) return "text-muted-foreground/30 text-center";
    if (val === "ε") return "text-amber-600 font-mono font-semibold text-center";
    return "text-primary font-mono text-xs font-medium";
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">LL(1) Parse Table</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Predictive parsing table computed from FIRST and FOLLOW sets.
          Each cell shows which production to apply given the non-terminal on the stack and the current input token.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-xs min-w-max">
            <thead>
              <tr className="bg-sidebar text-sidebar-foreground">
                <th className="px-3 py-3 font-semibold border-r border-sidebar-border text-left sticky left-0 bg-sidebar z-10 min-w-36">
                  Non-Terminal
                </th>
                {terminals.map((t) => (
                  <th key={t} className="px-3 py-3 font-semibold border-r border-sidebar-border last:border-0 text-center min-w-24 whitespace-nowrap font-mono">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NON_TERMINALS.map((nt, ri) => (
                <tr key={nt} className="border-t border-border hover:bg-muted/40 transition-colors">
                  <td className="px-3 py-2.5 border-r border-border font-mono font-semibold text-foreground italic bg-muted/50 sticky left-0 z-10 text-sm">
                    {nt}
                  </td>
                  {terminals.map((t) => {
                    const prod = parseTable[nt]?.[t];
                    const display = prod ? prod.join(" ") : "—";
                    return (
                      <td
                        key={t}
                        className={`px-3 py-2.5 border-r border-border last:border-0 align-middle ${cellClass(prod ? prod.join(" ") : undefined)}`}
                        title={prod ? `${nt} → ${prod.join(" ")}` : undefined}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">Legend</h3>
        <div className="flex flex-wrap gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/30 font-mono">—</span>
            <span className="text-muted-foreground">No production (error entry)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-mono font-semibold">ε</span>
            <span className="text-muted-foreground">Apply epsilon production</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-xs font-medium">id := e ;</span>
            <span className="text-muted-foreground">Apply the listed production</span>
          </div>
        </div>
      </div>
    </div>
  );
}
