// app/mindful-daily/words/page.tsx
import WordsClient from "./words-client"

export const dynamic = "force-dynamic"

export interface WordEntry {
  id: string
  word: string
  phonetic: string
  meaning: string
  example?: string
  timestamp: number
  isUserAdded?: boolean
  isAI?: boolean
}

/** ------- OpenAI helpers (server-only) ------- */
async function callOpenAIJSON(system: string, user: string) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY")

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    cache: "no-store",
  })
  if (!resp.ok) {
    const msg = await resp.text()
    throw new Error(`OpenAI error: ${msg}`)
  }
  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("No content from OpenAI")
  return JSON.parse(content)
}

async function getDailyWordFromAI() {
  const system = `You are a helpful vocabulary tutor. Always output STRICT JSON—no commentary.`
  const user = `
Generate ONE advanced but practical English vocabulary word suitable for adult learners in India.
Return fields:
- "word": string (single headword)
- "phonetic": string (IPA or easy phonetic)
- "meaning": 1–2 clear sentences (plain English, concise)
- "example": 1 example sentence in daily-life context

Return EXACTLY this structure:
{
  "word": "serendipity",
  "phonetic": "/ˌsɛrənˈdɪpɪti/",
  "meaning": "A lucky discovery made by chance.",
  "example": "Finding my old friend at the bookstore was pure serendipity."
}`

  const parsed = await callOpenAIJSON(system, user)
  const now = Date.now()
  return {
    id: `ai-${now}`,
    word: String(parsed.word || "").trim(),
    phonetic: String(parsed.phonetic || "").trim(),
    meaning: String(parsed.meaning || "").trim(),
    example: parsed.example ? String(parsed.example).trim() : "",
    timestamp: now,
    isAI: true,
  } as WordEntry
}

/** Server Action: Refresh daily word */
export async function refreshDailyWordAction(): Promise<WordEntry> {
  "use server"
  const w = await getDailyWordFromAI()
  return w
}

/** Initial render: fetch the daily word from AI */
export default async function WordsPage() {
  const dailyWord = await getDailyWordFromAI()
  return <WordsClient initialDailyWord={dailyWord} onRefreshDailyWord={refreshDailyWordAction} />
}
