import "server-only";

export type ClaimSuggestion = { category: string | null; confidence: number | null; source: string };

type ClassificationInput = {
  title: string;
  description: string | null;
  items: Array<{ description: string }>;
};

function parseSuggestion(value: unknown): { category: string | null; confidence: number | null } | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const category = data.category;
  const confidence = data.confidence;
  if (category === null && confidence === null) return { category: null, confidence: null };
  if (typeof category !== "string" || !category.trim() || category.length > 80) return null;
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
  return { category: category.trim(), confidence };
}

export async function suggestClaimCategory(input: ClassificationInput): Promise<ClaimSuggestion | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.CLAUDE_CLASSIFY_MODEL || "claude-sonnet-5";
  const content = [input.title, input.description, ...input.items.map((item) => item.description)]
    .filter(Boolean)
    .join("\n")
    .slice(0, 3000);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 128,
          system: "Classify staff expense claim text into a short, ordinary accounting category. Do not infer missing facts. Return null for both fields when the category is unclear. Confidence must reflect certainty from the supplied text.",
          tools: [{
            name: "suggest_category",
            description: "Return a category suggestion and its confidence, or null values when uncertain.",
            input_schema: {
              type: "object",
              properties: {
                category: { type: ["string", "null"], maxLength: 80 },
                confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
              },
              required: ["category", "confidence"],
              additionalProperties: false,
            },
          }],
          tool_choice: { type: "tool", name: "suggest_category" },
          messages: [{ role: "user", content: `Suggest one accounting category for this expense.\n<claim>\n${content}\n</claim>` }],
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (!response.ok) continue;
      const payload = await response.json() as { content?: Array<{ type?: string; input?: unknown }> };
      const toolUse = payload.content?.find((block) => block.type === "tool_use");
      const parsed = parseSuggestion(toolUse?.input);
      if (parsed) return { ...parsed, source: model };
    } catch {
      // A transient provider or network error gets one retry; claim submission remains available.
    }
  }

  return null;
}
