// app/mindful-daily/lifestyle/page.tsx
import LifestyleClient from "./lifestyle-client"

export const dynamic = "force-dynamic"

export interface LifestyleTip {
  id: string
  category: string
  title: string
  description: string
  benefits: string[]
  learnMore?: string
  isUserAdded?: boolean
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
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
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

async function getDailyLifestyleTipsFromAI(count = 2) {
  const system = `You are a lifestyle coach. Always return STRICT JSON only. No commentary/markdown.`
  const user = `
Generate ${count} concise, evidence-informed DAILY lifestyle tips for general wellness in India.
Each tip must be:
- Actionable in 10–30 minutes
- Safe for healthy adults (no medical claims/diagnosis)
- Vegetarian/ayurvedic-friendly language is welcome but not required
- Categories may include: "Mindfulness", "Movement", "Sleep", "Hydration", "Breathwork", "Environment", "Digital"
- Include brief plain-English benefits (3–5 bullet points, short phrases)
- Optionally include a reputable "learnMore" URL (WHO, NIH, Govt of India health portals, or established NGOs)

Return EXACTLY:
{
  "tips": [
    {
      "category": "Mindfulness",
      "title": "5-minute morning breath scan",
      "description": "Sit comfortably and scan breath from nose to belly for 5 minutes.",
      "benefits": ["Reduces stress", "Improves focus", "Calms nervous system"],
      "learnMore": "https://www.who.int/"
    }
  ]
}`

  const parsed = await callOpenAIJSON(system, user)
  const tips: LifestyleTip[] = Array.isArray(parsed?.tips)
    ? parsed.tips
        .filter((t: any) => t?.title && t?.description && t?.category)
        .slice(0, count)
        .map((t: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`,
          category: String(t.category),
          title: String(t.title),
          description: String(t.description),
          benefits: Array.isArray(t.benefits) ? t.benefits.map((b: any) => String(b)) : [],
          learnMore: t.learnMore ? String(t.learnMore) : undefined,
        }))
    : []

  return tips
}

/** Server Action: refresh tips from AI */
export async function refreshLifestyleTipsAction(): Promise<LifestyleTip[]> {
  "use server"
  const tips = await getDailyLifestyleTipsFromAI(2)
  return tips
}

/** Initial render: fetch tips from AI */
export default async function LifestylePage() {
  const tips = await getDailyLifestyleTipsFromAI(2)
  return <LifestyleClient initialTips={tips} refreshTips={refreshLifestyleTipsAction} />
}
