import { PARSE_TABLE_HEADERS, PARSE_TABLE_ROWS } from "@/data/compiler-data";

function cellClass(val: string) {
  if (val === "-") return "text-muted-foreground/40 text-center";
  if (val === "ε") return "text-amber-600 font-mono font-semibold text-center";
  return "text-primary font-mono text-xs font-medium";
}

export default function ParseTable() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">LL(1) Parse Table</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Predictive parsing table — rows are non-terminals, columns are input terminals.
          A cell shows which production to apply when the top of the stack is the non-terminal and the current input is the terminal.
        </p>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="text-xs min-w-max">
            <thead>
              <tr className="bg-sidebar text-sidebar-foreground">
                {PARSE_TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    className={`px-3 py-3 font-semibold border-r border-sidebar-border last:border-0 whitespace-nowrap ${
                      h === "Non-Terminal" ? "text-left sticky left-0 bg-sidebar z-10 min-w-36" : "text-center min-w-20"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PARSE_TABLE_ROWS.map((row, ri) => (
                <tr key={ri} className="border-t border-border hover:bg-muted/40 transition-colors">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-3 py-2.5 border-r border-border last:border-0 align-middle ${
                        ci === 0
                          ? "font-mono font-semibold text-foreground italic bg-muted/50 sticky left-0 z-10 text-sm"
                          : cellClass(cell)
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
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
            <span className="text-muted-foreground/40 font-mono">-</span>
            <span className="text-muted-foreground">Error entry (no production defined)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-600 font-mono font-semibold">ε</span>
            <span className="text-muted-foreground">Apply epsilon (empty) production</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-primary font-mono text-xs font-medium">asgn</span>
            <span className="text-muted-foreground">Apply named production shorthand</span>
          </div>
        </div>
      </div>
    </div>
  );
}
