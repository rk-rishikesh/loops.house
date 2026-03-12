"use client";

export interface LeaderboardEntry {
  rank: number;
  project_id: string;
  project_name: string;
  final_score: number;
  ai_score_weighted: number;
  judge_score_weighted: number;
  raw_ai_score: number;
  raw_judge_avg_score: number;
}

interface Props {
  entries: LeaderboardEntry[];
  aiWeight?: number;
  showWeightBreakdown?: boolean;
}

export function HackathonLeaderboard({ entries, aiWeight, showWeightBreakdown = false }: Props) {
  if (entries.length === 0) {
    return (
      <p className="text-sm opacity-50" style={{ color: "#2d4a3e" }}>
        No scored submissions yet.
      </p>
    );
  }

  const medals = ["", "\u{1F947}", "\u{1F948}", "\u{1F949}"];

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "rgba(15,44,35,0.1)" }}
    >
      <table className="w-full text-sm" style={{ color: "#2d4a3e" }}>
        <thead>
          <tr style={{ background: "rgba(15,44,35,0.04)" }}>
            <th className="px-4 py-3 text-left font-medium">#</th>
            <th className="px-4 py-3 text-left font-medium">Project</th>
            <th className="px-4 py-3 text-right font-medium">Final Score</th>
            {showWeightBreakdown && (
              <>
                <th className="px-4 py-3 text-right font-medium">
                  AI ({aiWeight !== undefined ? `${Math.round(aiWeight * 100)}%` : ""})
                </th>
                <th className="px-4 py-3 text-right font-medium">
                  Judges ({aiWeight !== undefined ? `${Math.round((1 - aiWeight) * 100)}%` : ""})
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            return (
              <tr
                key={entry.project_id}
                className="border-t"
                style={{
                  borderColor: "rgba(15,44,35,0.06)",
                  background: isTop3 ? "rgba(214,168,74,0.04)" : "white",
                }}
              >
                <td className="px-4 py-3 font-medium">
                  {isTop3 ? medals[entry.rank] : entry.rank}
                </td>
                <td className="px-4 py-3 font-medium">{entry.project_name}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {entry.final_score.toFixed(1)}
                </td>
                {showWeightBreakdown && (
                  <>
                    <td className="px-4 py-3 text-right tabular-nums opacity-70">
                      {entry.raw_ai_score.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums opacity-70">
                      {entry.raw_judge_avg_score.toFixed(1)}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
