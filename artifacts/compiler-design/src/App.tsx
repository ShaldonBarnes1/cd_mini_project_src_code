import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LexicalAnalysis from "@/pages/LexicalAnalysis";
import Grammar from "@/pages/Grammar";
import FirstFollow from "@/pages/FirstFollow";
import ParseTable from "@/pages/ParseTable";
import ParsingActions from "@/pages/ParsingActions";

const queryClient = new QueryClient();

type Tab = "lexical" | "grammar" | "firstfollow" | "parsetable" | "actions";

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: "lexical", label: "Lexical Analysis", short: "Lexical" },
  { id: "grammar", label: "Grammar", short: "Grammar" },
  { id: "firstfollow", label: "FIRST / FOLLOW", short: "FIRST/FOLLOW" },
  { id: "parsetable", label: "Parse Table", short: "Parse Table" },
  { id: "actions", label: "Parsing Actions", short: "Actions" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("lexical");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
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
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="bg-card border-b border-border shadow-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex overflow-x-auto scrollbar-none">
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
          {activeTab === "lexical" && <LexicalAnalysis />}
          {activeTab === "grammar" && <Grammar />}
          {activeTab === "firstfollow" && <FirstFollow />}
          {activeTab === "parsetable" && <ParseTable />}
          {activeTab === "actions" && <ParsingActions />}
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          Compiler Design Mini Project — NMAM Institute of Technology, Nitte
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
