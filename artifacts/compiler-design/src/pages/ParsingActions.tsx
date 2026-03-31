import { useState } from "react";
import type { CompilerResult } from "@/lib/compiler-engine";

function actionClass(action: string) {
  if (action.includes("successfully"))    return "text-emerald-700 font-semibold";
  if (action.startsWith("Apply:"))        return "text-blue-700";
  if (action.startsWith("Match"))         return "text-violet-700";
  if (action === "Start parsing")         return "text-amber-700 font-semibold";
  if (action.startsWith("ERROR"))         return "text-destructive font-semibold";
  return "text-foreground";
}

const PAGE_SIZE = 25;

export default function ParsingActions({ result }: { result: CompilerResult }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const steps = result.parseSteps;
  const lastAction = steps[steps.length - 1]?.action ?? "";
  const success = lastAction.includes("successfully");

  const filtered = search.trim()
    ? steps.filter(
        (a) =>
          a.action.toLowerCase().includes(search.toLowerCase()) ||
          a.input.toLowerCase().includes(search.toLowerCase()) ||
          a.stack.toLowerCase().includes(search.toLowerCase()) ||
          String(a.step).includes(search)
      )
    : steps;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Full Parsing Actions</h2>
        <p className="text-sm text-muted-foreground mb-2">
          LL(1) parse trace — step-by-step stack operations and reductions
        </p>
        <div className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border ${
          success
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-destructive/10 text-destructive border-destructive/20"
        }`}>
          <div className={`w-2 h-2 rounded-full ${success ? "bg-emerald-500" : "bg-destructive"}`} />
          {success ? `Accepted — ${steps.length} steps` : `Parse failed — ${steps.length} steps completed`}
        </div>
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

      {steps.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          No parse steps — check for lexer errors in the Lexical Analysis tab.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-3 font-semibold text-foreground w-16">Step</th>
                  <th className="text-left px-3 py-3 font-semibold text-foreground min-w-48">Stack</th>
                  <th className="text-left px-3 py-3 font-semibold text-foreground min-w-28">Input Symbol</th>
                  <th className="text-left px-3 py-3 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr
                    key={row.step}
                    className={`border-b border-border last:border-0 transition-colors ${
                      row.action.includes("successfully") ? "bg-emerald-50" :
                      row.action.startsWith("ERROR")      ? "bg-destructive/5" :
                      "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground font-semibold">
                      {row.step}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground max-w-xs truncate">
                      {row.stack}
                    </td>
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
      )}

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
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-400"></div><span className="text-muted-foreground">Apply production rule</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-violet-400"></div><span className="text-muted-foreground">Match terminal</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-400"></div><span className="text-muted-foreground">Parsing success</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-400"></div><span className="text-muted-foreground">Parse error</span></div>
        </div>
      </div>
    </div>
  );
}
