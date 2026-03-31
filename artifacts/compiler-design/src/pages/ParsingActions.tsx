import { useState } from "react";
import { PARSING_ACTIONS } from "@/data/compiler-data";

function actionClass(action: string) {
  if (action.includes("successfully")) return "text-emerald-700 font-semibold";
  if (action.startsWith("Apply:")) return "text-blue-700";
  if (action.startsWith("Match")) return "text-violet-700";
  if (action === "Start parsing") return "text-amber-700 font-semibold";
  return "text-foreground";
}

const PAGE_SIZE = 25;

export default function ParsingActions() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? PARSING_ACTIONS.filter(
        (a) =>
          a.action.toLowerCase().includes(search.toLowerCase()) ||
          a.input.toLowerCase().includes(search.toLowerCase()) ||
          a.stack.toLowerCase().includes(search.toLowerCase()) ||
          String(a.step).includes(search)
      )
    : PARSING_ACTIONS;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Full Parsing Actions</h2>
        <p className="text-sm text-muted-foreground mb-4">
          125-step LL(1) parse trace — stack operations and reductions for the sample program
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input
          type="search"
          placeholder="Filter steps, symbols, actions..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring w-full sm:w-72"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{filtered.length} steps</span>
          {search && <button onClick={() => setSearch("")} className="text-primary hover:underline">Clear</button>}
        </div>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-3 py-3 font-semibold text-foreground w-16">Step</th>
                <th className="text-left px-3 py-3 font-semibold text-foreground min-w-36">Stack</th>
                <th className="text-left px-3 py-3 font-semibold text-foreground min-w-32">Input Symbol</th>
                <th className="text-left px-3 py-3 font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((row) => (
                <tr
                  key={row.step}
                  className={`border-b border-border last:border-0 transition-colors ${
                    row.step === 125 ? "bg-emerald-50" : "hover:bg-muted/40"
                  }`}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground font-semibold">
                    {row.step}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-foreground">{row.stack || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">
                    {row.input ? (
                      <span className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{row.input}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={`px-3 py-2.5 text-xs ${actionClass(row.action)}`}>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!search && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-3 py-1.5 rounded-md border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors"
          >
            Next
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">Action Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-400"></div>
            <span className="text-muted-foreground">Start parsing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span className="text-muted-foreground">Apply production rule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-violet-400"></div>
            <span className="text-muted-foreground">Match terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-400"></div>
            <span className="text-muted-foreground">Parsing success</span>
          </div>
        </div>
      </div>
    </div>
  );
}
