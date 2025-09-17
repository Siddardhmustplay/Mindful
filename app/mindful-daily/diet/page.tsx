// app/mindful-daily/diet/page.tsx
import DietClient from "./diet-client"

export const dynamic = "force-dynamic"

type Category = "Breakfast" | "Lunch" | "Dinner" | "Snacks"

export interface DietItem {
  dish: string
  nutrition: string
}

export interface DietStore {
  recommendations: Record<Category, DietItem[]>
  timestamps: Partial<Record<Category, number>>
}

const ALL_CATEGORIES: Category[] = ["Breakfast", "Lunch", "Dinner", "Snacks"]

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
      temperature: 0.7,
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

async function getDietFromOpenAI(cats: Category[]) {
  const system = `You are a culinary assistant for vegetarian Indian-friendly meal planning. 
You ALWAYS return STRICT JSON only. No commentary, no markdown, no extra text.`

  const user = `
Generate **vegetarian, egg-free** Indian-friendly meal suggestions for categories: ${cats.join(", ")}.

For EACH category, return an array of 8 items:
{ "dish": string, "nutrition": string }

Constraints:
- Vegetarian (NO egg/meat/fish). Use plant proteins (dal, paneer, tofu), whole grains, millets, vegetables, legumes.
- "nutrition" <= 120 chars; highlight macros or notable vitamins/minerals (e.g., "High protein; iron & B vitamins").
- Avoid duplicates across categories; ensure regional variety across weeks (North/South/West/East).
- No beverages/sweets; focus on balanced meals/snacks.
- No markdown/prose. Return EXACTLY:
{
  "recommendations": {
    ${cats.map((c) => `"${c}": [{"dish":"", "nutrition":""}]`).join(", ")}
  }
}`

  const parsed = await callOpenAIJSON(system, user)

  const out = {} as Record<Category, DietItem[]>
  for (const c of cats) {
    const arr = Array.isArray(parsed?.recommendations?.[c]) ? parsed.recommendations[c] : []
    out[c] = arr
      .filter((x: any) => x?.dish && x?.nutrition)
      .map((x: any) => ({ dish: String(x.dish), nutrition: String(x.nutrition) }))
  }
  return out
}

export async function refreshDietAction(filter: "All" | Category) {
  "use server"
  const cats = filter === "All" ? ALL_CATEGORIES : [filter]
  return await getDietFromOpenAI(cats) // returns only requested categories
}

export async function getRecipeStepsAction(dish: string) {
  "use server"
  const system = `You are a recipe assistant for vegetarian Indian-friendly cuisine. Respond with STRICT JSON only.`

  const user = `
Provide a concise, reliable recipe for the vegetarian dish "${dish}".

Return:
{
  "serves": number,
  "time": { "prep": "string", "cook": "string" },
  "ingredients": ["item 1", "item 2", ...],  // 8–16 items, metric-first
  "steps": ["short step 1", "short step 2", ...] // 6–12 clear, actionable steps; avoid fluff
}

Rules:
- Vegetarian only (no egg/meat/fish). If dish traditionally includes egg, give a vegetarian alternative.
- Use common Indian pantry items where possible; metric-first (g, ml), with common local measures in parentheses if helpful.
- Prioritize good sequencing, safety, and authenticity, but keep it brief.
- No extra commentary or markdown outside the JSON.`

  const parsed = await callOpenAIJSON(system, user)

  // normalize minimally
  return {
    serves: Number(parsed?.serves ?? 2),
    time: {
      prep: String(parsed?.time?.prep ?? "10 min"),
      cook: String(parsed?.time?.cook ?? "20 min"),
    },
    ingredients: Array.isArray(parsed?.ingredients) ? parsed.ingredients.map((x: any) => String(x)) : [],
    steps: Array.isArray(parsed?.steps) ? parsed.steps.map((x: any) => String(x)) : [],
  }
}

/** ------- Initial render (AI on first load) ------- */
export default async function DietPage() {
  const recommendations = await getDietFromOpenAI(ALL_CATEGORIES)
  const ts = Date.now()
  const store: DietStore = {
    recommendations: {
      Breakfast: recommendations.Breakfast ?? [],
      Lunch: recommendations.Lunch ?? [],
      Dinner: recommendations.Dinner ?? [],
      Snacks: recommendations.Snacks ?? [],
    },
    timestamps: {
      Breakfast: ts,
      Lunch: ts,
      Dinner: ts,
      Snacks: ts,
    },
  }

  return (
    <DietClient
      initialStore={store}
      refreshDiet={refreshDietAction}
      getRecipeSteps={getRecipeStepsAction}
    />
  )
}
