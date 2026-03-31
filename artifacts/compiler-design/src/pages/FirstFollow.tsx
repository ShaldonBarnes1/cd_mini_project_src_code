import type { CompilerResult } from "@/lib/compiler-engine";
import { NON_TERMINALS } from "@/lib/compiler-engine";

function SetTable({ title, subtitle, data, colorClass }: {
  title: string;
  subtitle: string;
  data: { nonTerminal: string; members: string[] }[];
  colorClass: string;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-3">{subtitle}</p>
      <div className="rounded-lg border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-foreground w-44">Non-Terminal</th>
              <th className="text-left px-4 py-3 font-semibold text-foreground">Set Members</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.nonTerminal} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-sm font-semibold text-foreground italic">{row.nonTerminal}</span>
                </td>
                <td className="px-4 py-3">
                  {row.members.length === 0 ? (
                    <span className="text-muted-foreground text-xs italic">empty</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {row.members.map((sym) => (
                        <span key={sym} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-medium border ${colorClass}`}>
                          {sym}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function FirstFollow({ result }: { result: CompilerResult }) {
  const firstData = NON_TERMINALS.map((nt) => ({
    nonTerminal: nt,
    members: result.firstSets[nt] ?? [],
  }));
  const followData = NON_TERMINALS.map((nt) => ({
    nonTerminal: nt,
    members: result.followSets[nt] ?? [],
  }));

  return (
    <div className="space-y-8">
      <SetTable
        title="FIRST Sets"
        subtitle="The set of terminal symbols that can appear as the first symbol of any string derived from the non-terminal"
        data={firstData}
        colorClass="bg-blue-50 text-blue-700 border-blue-200"
      />
      <SetTable
        title="FOLLOW Sets"
        subtitle="The set of terminal symbols that can appear immediately to the right of a non-terminal in some sentential form"
        data={followData}
        colorClass="bg-emerald-50 text-emerald-700 border-emerald-200"
      />
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-semibold text-foreground mb-3">How FIRST &amp; FOLLOW Are Used</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="space-y-1.5">
            <p className="font-medium text-foreground">FIRST(A) rule:</p>
            <p>For a production A → α, if the next input token is in FIRST(α), the parser applies this production.</p>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium text-foreground">FOLLOW(A) rule:</p>
            <p>If α can derive ε, and the next input token is in FOLLOW(A), the parser also applies A → α (epsilon production).</p>
          </div>
        </div>
      </section>
    </div>
  );
}
