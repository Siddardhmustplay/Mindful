// app/mindful-daily/wisdom/page.tsx
import WisdomClient from "./wisdom-client"

export const dynamic = "force-dynamic" // always fetch fresh on navigation (optional)

type CategoryKey = "all" | "bhagavad-gita" | "motivation" | "wisdom"

interface Quote {
  quote: string
  author: string
}

interface DailyWord {
  word: string
  phonetic: string
  meaning: string
  example: string
  timestamp: number
}

export interface WisdomStore {
  dailyWord?: DailyWord
  quotes: {
    all: Quote[]
    "bhagavad-gita": Quote[]
    motivation: Quote[]
    wisdom: Quote[]
  }
  timestamps: Partial<Record<CategoryKey | "dailyWord", number>>
}

/** ---- OpenAI fetcher (server-side only) ---- */
async function getFromOpenAI(cats: CategoryKey[], includeWord: boolean) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY")
  }

  const system = `You are a helpful assistant that ONLY responds with STRICT JSON.`
  const user = `
Generate:
1) For each of the categories: ${cats.join(", ") || "(none)"}, return 5 short quotes as an array of { "quote": string, "author": string }.
- "bhagavad-gita" should be styled as from the Bhagavad Gita (e.g. Krishna).
- "motivation" and "wisdom" should be brief, <=140 chars.
- "all" is a balanced mix (concise; no duplicates).

2) ${includeWord ? `A "dailyWord" object with { "word": "", "phonetic": "", "meaning": "", "example": "" }.` : `No dailyWord.`}

Return EXACTLY:
{
  "quotes": {
    ${cats.map((c) => `"${c}": [{"quote":"","author":""}]`).join(", ")}
  }${includeWord ? `,
  "dailyWord": { "word": "", "phonetic": "", "meaning": "", "example": "" }` : ""}
}
`

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
    // No need for cache here; it's a live call
  })

  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`OpenAI error: ${t}`)
  }

  const data = await resp.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("No content from OpenAI")
  const parsed = JSON.parse(content)

  // Normalize the shape we expect back
  const quotes: Partial<Record<CategoryKey, Quote[]>> = {}
  for (const c of cats) {
    quotes[c] = Array.isArray(parsed?.quotes?.[c]) ? parsed.quotes[c] : []
  }

  const dailyWord = includeWord ? parsed.dailyWord ?? null : null

  return { quotes, dailyWord }
}

/** ---- Server Actions passed to the client ---- */
export async function refreshDailyWordAction(): Promise<DailyWord> {
  "use server"
  const { dailyWord } = await getFromOpenAI([], true)
  const ts = Date.now()
  return { ...dailyWord, timestamp: ts }
}

export async function refreshCategoryAction(cat: CategoryKey): Promise<Quote[]> {
  "use server"
  const { quotes } = await getFromOpenAI([cat], false)
  return quotes[cat] ?? []
}

/** ---- Initial render (server) ---- */
export default async function WisdomPage() {
  // Fetch all categories + daily word for first paint
  const { quotes, dailyWord } = await getFromOpenAI(
    ["all", "bhagavad-gita", "motivation", "wisdom"],
    true,
  )
  const ts = Date.now()

  const initialStore: WisdomStore = {
    dailyWord: dailyWord
      ? { ...dailyWord, timestamp: ts }
      : undefined,
    quotes: {
      all: quotes["all"] ?? [],
      "bhagavad-gita": quotes["bhagavad-gita"] ?? [],
      motivation: quotes["motivation"] ?? [],
      wisdom: quotes["wisdom"] ?? [],
    },
    timestamps: {
      dailyWord: ts,
      all: ts,
      "bhagavad-gita": ts,
      motivation: ts,
      wisdom: ts,
    },
  }

  return (
    <WisdomClient
      initialStore={initialStore}
      refreshDailyWord={refreshDailyWordAction}
      refreshCategory={refreshCategoryAction}
    />
  )
}
