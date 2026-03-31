import { useState, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { runCompiler, type CompilerResult } from "@/lib/compiler-engine";
import LexicalAnalysis from "@/pages/LexicalAnalysis";
import Grammar from "@/pages/Grammar";
import FirstFollow from "@/pages/FirstFollow";
import ParseTable from "@/pages/ParseTable";
import ParsingActions from "@/pages/ParsingActions";

const queryClient = new QueryClient();

type Tab = "lexical" | "grammar" | "firstfollow" | "parsetable" | "actions";

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "lexical",     label: "Lexical Analysis", short: "Lexical" },
  { id: "grammar",     label: "Grammar",           short: "Grammar" },
  { id: "firstfollow", label: "FIRST / FOLLOW",    short: "FIRST/FOLLOW" },
  { id: "parsetable",  label: "Parse Table",        short: "Parse Table" },
  { id: "actions",     label: "Parsing Actions",    short: "Actions" },
];

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

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("lexical");
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [draft, setDraft] = useState(DEFAULT_SOURCE);
  const [result, setResult] = useState<CompilerResult>(() => runCompiler(DEFAULT_SOURCE));
  const [panelOpen, setPanelOpen] = useState(false);

  const handleRun = useCallback(() => {
    const r = runCompiler(draft);
    setResult(r);
    setSource(draft);
    setPanelOpen(false);
  }, [draft]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleRun();
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-sidebar-foreground/50 font-medium tracking-widest uppercase mb-0.5">
                  NMAM Institute of Technology, Nitte
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-sidebar-foreground leading-tight">
                  Compiler Design Mini Project
                </h1>
                <p className="text-sm text-sidebar-foreground/70 mt-0.5">
                  Designing a Compiler for a Hypothetical Language
                </p>
              </div>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className="shrink-0 mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Program
              </button>
            </div>
          </div>
        </header>

        {/* Input Panel */}
        {panelOpen && (
          <div className="bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Source Program</p>
                  <p className="text-xs text-muted-foreground">
                    Type a program using the hypothetical language — must start with BEGIN and end with END.
                    Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-xs">Ctrl+Enter</kbd> to compile.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDraft(DEFAULT_SOURCE); }}
                    className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors text-muted-foreground"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleRun}
                    className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium shadow-sm"
                  >
                    Compile
                  </button>
                </div>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                rows={14}
                className="w-full font-mono text-sm bg-sidebar text-sidebar-foreground rounded-lg p-4 border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-primary resize-y leading-relaxed"
              />
              {result.lexResult.error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
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
          <div className={`border-b px-4 sm:px-6 py-2 text-xs flex items-center gap-3 ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : result.lexResult.error
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              result.success ? "bg-emerald-500" : result.lexResult.error ? "bg-red-500" : "bg-amber-500"
            }`} />
            {result.success
              ? `Compiled successfully — ${result.lexResult.tokens.length} tokens, ${result.parseSteps.length} parse steps`
              : result.lexResult.error
              ? result.lexResult.error
              : "Parse error — check program syntax"}
            <span className="ml-auto text-current/60 font-mono truncate max-w-xs hidden sm:block">
              {source.split("\n")[0]}…
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 sm:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
                    activeTab === tab.id
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {activeTab === "lexical"     && <LexicalAnalysis result={result} source={source} />}
          {activeTab === "grammar"     && <Grammar />}
          {activeTab === "firstfollow" && <FirstFollow result={result} />}
          {activeTab === "parsetable"  && <ParseTable result={result} />}
          {activeTab === "actions"     && <ParsingActions result={result} />}
        </main>

        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          Compiler Design Mini Project — NMAM Institute of Technology, Nitte
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
