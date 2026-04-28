/**
 * Trims conversation to the last maxMessages entries without producing consecutive
 * same-role turns — Gemini content streams require user/model alternation.
 */
export function summarizeConversationHistory(
  history: { role: string; content: string }[],
  maxMessages: number,
): { role: string; content: string }[] {
  if (history.length <= maxMessages) return history;

  const older = history.slice(0, history.length - maxMessages);
  const recent = history.slice(history.length - maxMessages);
  const summary = older.map((m) => `${m.role}: ${m.content.slice(0, 100)}`).join("\n");
  const summaryPrefix = `[Earlier conversation summary]\n${summary}\n\n`;

  if (recent.length === 0) {
    return [{ role: "user", content: summaryPrefix.trim() }];
  }

  const [first, ...rest] = recent;
  if (first.role === "user") {
    return [{ ...first, content: summaryPrefix + first.content }, ...rest];
  }

  return [{ role: "user", content: summaryPrefix.trim() }, ...recent];
}
