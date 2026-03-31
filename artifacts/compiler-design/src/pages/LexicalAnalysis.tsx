import { useState } from "react";
import type { CompilerResult } from "@/lib/compiler-engine";

const TOKEN_COLORS: Record<string, string> = {
  KEYWORD:    "bg-blue-100 text-blue-800 border-blue-200",
  IDENTIFIER: "bg-green-100 text-green-800 border-green-200",
  NUMBER:     "bg-purple-100 text-purple-800 border-purple-200",
  STRING:     "bg-amber-100 text-amber-800 border-amber-200",
  OPERATOR:   "bg-rose-100 text-rose-800 border-rose-200",
};

export default function LexicalAnalysis({ result, source }: { result: CompilerResult; source: string }) {
  const [activeSymTab, setActiveSymTab] = useState<"keywords" | "identifiers" | "literals">("keywords");
  const { lexResult } = result;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-foreground mb-1">Source Program</h2>
        <p className="text-sm text-muted-foreground mb-3">Input source code currently loaded</p>
        <pre className="bg-sidebar text-sidebar-foreground rounded-lg p-5 text-sm font-mono leading-relaxed overflow-x-auto border border-sidebar-border shadow-sm">
          {source}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-1">Token Table</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {lexResult.tokens.length} tokens identified by the lexical analyzer
        </p>
        {lexResult.error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {lexResult.error}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-foreground w-8">#</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Lexeme</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">Token ID</th>
                  </tr>
                </thead>
                <tbody>
                  {lexResult.tokens.map((token, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${TOKEN_COLORS[token.type] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                          {token.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sm text-foreground">{token.lexeme}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-primary font-semibold">{token.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-1">Symbol Tables</h2>
        <p className="text-sm text-muted-foreground mb-3">Extracted symbols categorized by type</p>
        <div className="flex gap-2 mb-4">
          {(["keywords", "identifiers", "literals"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSymTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSymTab === tab
                  ? "bg-primary text-primary-foreground shadow"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs opacity-70">
                ({tab === "keywords" ? lexResult.keywords.length : tab === "identifiers" ? lexResult.identifiers.length : lexResult.literals.length})
              </span>
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-border overflow-hidden shadow-sm">
          {activeSymTab === "keywords"    && <SymTable items={lexResult.keywords}    label="Keyword"    color="bg-blue-100 text-blue-800 border-blue-200" />}
          {activeSymTab === "identifiers" && <SymTable items={lexResult.identifiers} label="Identifier" color="bg-green-100 text-green-800 border-green-200" />}
          {activeSymTab === "literals"    && <SymTable items={lexResult.literals}    label="Literal"    color="bg-amber-100 text-amber-800 border-amber-200" />}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground mb-1">Token Stream</h2>
        <p className="text-sm text-muted-foreground mb-3">Normalized token sequence passed to the parser</p>
        <div className="bg-muted rounded-lg p-4 flex flex-wrap gap-1.5 border border-border">
          {lexResult.tokenStream.map((t, i) => (
            <span key={i} className={`px-2 py-0.5 rounded text-xs font-mono font-medium border ${
              t === "$" ? "bg-sidebar text-sidebar-foreground border-sidebar-border" :
              TOKEN_COLORS[t] ?? "bg-secondary text-secondary-foreground border-secondary"
            }`}>
              {t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function SymTable({ items, label, color }: { items: string[]; label: string; color: string }) {
  if (!items.length) {
    return (
      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
        No {label.toLowerCase()}s found
      </div>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted border-b border-border">
          <th className="text-left px-4 py-3 font-semibold text-foreground w-12">#</th>
          <th className="text-left px-4 py-3 font-semibold text-foreground">{label}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={item} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
            <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
            <td className="px-4 py-2.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border font-mono ${color}`}>
                {item}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
