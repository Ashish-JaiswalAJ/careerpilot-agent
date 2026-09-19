const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : trimmed;
  const start = body.search(/[[{]/);
  if (start === -1) return body;
  const lastObj = body.lastIndexOf("}");
  const lastArr = body.lastIndexOf("]");
  const end = Math.max(lastObj, lastArr);
  return body.slice(start, end + 1);
}

/** Calls the Lovable AI Gateway and parses the JSON object it returns. */
export async function askAiForJson<T>(system: string, user: string): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this project.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: `${system}\n\nRespond with raw JSON only. No prose, no markdown.` },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429) {
      throw new Error("The AI is busy right now. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits for this workspace are exhausted.");
    }
    console.error("AI gateway error", response.status, detail);
    throw new Error("The AI analysis failed. Please try again.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content ?? "";

  try {
    return JSON.parse(stripFences(content)) as T;
  } catch {
    console.error("Unparseable AI response", content.slice(0, 2000));
    throw new Error("The AI returned an unexpected result. Please try again.");
  }
}
