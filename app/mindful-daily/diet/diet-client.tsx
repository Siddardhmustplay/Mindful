// app/mindful-daily/diet/diet-client.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { RefreshCw } from "lucide-react"
import type { DietItem, DietStore } from "./page"

type Category = "Breakfast" | "Lunch" | "Dinner" | "Snacks"
type Filter = "All" | Category

type RefreshDiet = (filter: Filter) => Promise<Partial<Record<Category, DietItem[]>>>
type GetRecipeSteps = (dish: string) => Promise<{
  serves: number
  time: { prep: string; cook: string }
  ingredients: string[]
  steps: string[]
}>

const STORAGE_KEY = "jivana-daily-diet" // store the currently chosen dish for the day (not the full lists)

const EMPTY_STORE: DietStore = {
  recommendations: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
  timestamps: {},
}

interface MealRecommendation {
  mealType: Category
  dish: string
  nutrition: string
  timestamp: number
}

export default function DietClient({
  initialStore,
  refreshDiet,
  getRecipeSteps,
}: {
  initialStore: DietStore
  refreshDiet: RefreshDiet
  getRecipeSteps: GetRecipeSteps
}) {
  const [store, setStore] = useState<DietStore>(initialStore ?? EMPTY_STORE)
  const [activeFilter, setActiveFilter] = useState<Filter>("All")
  const [currentRecommendation, setCurrentRecommendation] = useState<MealRecommendation | null>(null)
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  const [loadingTab, setLoadingTab] = useState<Category | null>(null)

  // Recipe dialog
  const [recipeOpen, setRecipeOpen] = useState(false)
  const [recipeDish, setRecipeDish] = useState<string>("")
  const [recipeData, setRecipeData] = useState<Awaited<ReturnType<GetRecipeSteps>> | null>(null)
  const [recipeLoading, setRecipeLoading] = useState(false)

  const allCategories: Category[] = useMemo(() => ["Breakfast", "Lunch", "Dinner", "Snacks"], [])

  // pick a dish from the current lists
  const pickFromStore = useCallback(
    (filter: Filter): MealRecommendation | null => {
      const rand = <T,>(arr: T[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : undefined)

      let cat: Category | undefined
      if (filter === "All") {
        const nonEmpty = allCategories.filter((c) => (store.recommendations[c] ?? []).length > 0)
        if (!nonEmpty.length) return null
        cat = rand(nonEmpty)
      } else {
        cat = filter
      }

      const list = store.recommendations[cat!] ?? []
      if (!list.length) return null
      const item = rand(list)!
      return {
        mealType: cat!,
        dish: item.dish,
        nutrition: item.nutrition,
        timestamp: Date.now(),
      }
    },
    [store.recommendations, allCategories],
  )

  // initial: use server-provided AI data, but keep the user's "today pick" stable via localStorage
  useEffect(() => {
    const cached = getLocalStorageItem<MealRecommendation | null>(STORAGE_KEY, null)
    const today = new Date().toISOString().split("T")[0]
    if (cached && new Date(cached.timestamp).toISOString().split("T")[0] === today) {
      setCurrentRecommendation(cached)
    } else {
      const pick = pickFromStore("All")
      if (pick) {
        setCurrentRecommendation(pick)
        setLocalStorageItem(STORAGE_KEY, pick)
      }
    }
  }, [pickFromStore])

  /** Single Refresh button: update from AI for the active filter (All or a single category). */
  const handleRefreshFromAI = async () => {
    try {
      setLoadingRefresh(true)
      const incoming = await refreshDiet(activeFilter)

      setStore((prev) => {
        const recs = { ...prev.recommendations }
        const ts = Date.now()
        const stamps = { ...(prev.timestamps ?? {}) }
        for (const key of Object.keys(incoming) as Category[]) {
          recs[key] = (incoming[key] ?? []).map((x) => ({ dish: String(x.dish), nutrition: String(x.nutrition) }))
          stamps[key] = ts
        }
        return { recommendations: recs, timestamps: stamps }
      })

      // choose a new dish from updated lists (respecting active filter)
      const pick = pickFromStore(activeFilter)
      if (pick) {
        setCurrentRecommendation(pick)
        setLocalStorageItem(STORAGE_KEY, pick)
      }
    } finally {
      setLoadingRefresh(false)
    }
  }

  /** Per-tab refresh: update that single category from AI. */
  const handleRefreshCategory = async (cat: Category) => {
    try {
      setLoadingTab(cat)
      const incoming = await refreshDiet(cat)
      setStore((prev) => {
        const recs = { ...prev.recommendations }
        const ts = Date.now()
        const stamps = { ...(prev.timestamps ?? {}) }
        recs[cat] = (incoming[cat] ?? []).map((x) => ({ dish: String(x.dish), nutrition: String(x.nutrition) }))
        stamps[cat] = ts
        return { recommendations: recs, timestamps: stamps }
      })
      // if user is viewing All or this exact tab, pick a fresh one from that category set
      if (activeFilter === "All" || activeFilter === cat) {
        const pick = pickFromStore(activeFilter === "All" ? "All" : cat)
        if (pick) {
          setCurrentRecommendation(pick)
          setLocalStorageItem(STORAGE_KEY, pick)
        }
      }
    } finally {
      setLoadingTab(null)
    }
  }

  const handleFilterChange = (val: string) => {
    const next = val as Filter
    setActiveFilter(next)
    const pick = pickFromStore(next)
    if (pick) {
      setCurrentRecommendation(pick)
      setLocalStorageItem(STORAGE_KEY, pick)
    }
  }

  const handleOpenRecipe = async (dish: string) => {
    setRecipeDish(dish)
    setRecipeOpen(true)
    setRecipeLoading(true)
    try {
      const data = await getRecipeSteps(dish)
      setRecipeData(data)
    } finally {
      setRecipeLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
        Healthy Diet — Vegetarian food recommendations for your mindful journey
      </h1>

      {/* Today’s Recommendation + single Refresh (from AI) */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today’s Recommendation</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefreshFromAI}
            disabled={loadingRefresh}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {loadingRefresh ? "Refreshing…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {currentRecommendation ? (
            <div className="space-y-2">
              <p className="text-jivana-text-slate-700 text-sm">
                Meal Type:{" "}
                <span className="font-medium text-jivana-text-slate-900">{currentRecommendation.mealType}</span>
              </p>
              <h3 className="text-2xl font-semibold text-jivana-accent">{currentRecommendation.dish}</h3>
              <p className="text-jivana-text-slate-900 text-lg">{currentRecommendation.nutrition}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-jivana-accent text-jivana-accent hover:bg-jivana-accent/10 bg-transparent"
                onClick={() => handleOpenRecipe(currentRecommendation.dish)}
              >
                View Recipe
              </Button>
              <p className="text-jivana-text-slate-700 text-xs mt-2">
                Updated {formatTimeAgo(currentRecommendation.timestamp)}
              </p>
            </div>
          ) : (
            <p className="text-jivana-text-slate-700 italic">Preparing recommendation…</p>
          )}
        </CardContent>
      </Card>

      {/* Explore Dishes with per-category Refresh */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Explore Dishes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="All" onValueChange={handleFilterChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-jivana-background border border-jivana-text-slate-700/20">
              {(["All", "Breakfast", "Lunch", "Dinner", "Snacks"] as Filter[]).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white flex items-center justify-center"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Category tabs */}
            {(["Breakfast", "Lunch", "Dinner", "Snacks"] as Category[]).map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-jivana-text-slate-900">{cat}</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRefreshCategory(cat)}
                    disabled={loadingTab === cat}
                    className="border-jivana-text-slate-700/20"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {loadingTab === cat ? "Refreshing…" : "Refresh"}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {(store.recommendations[cat] ?? []).map((dish, index) => (
                    <li
                      key={`${cat}-${index}-${dish.dish}`}
                      className="p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-jivana-text-slate-900">{dish.dish}</h4>
                          <p className="text-jivana-text-slate-700 text-sm">{dish.nutrition}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-jivana-accent hover:bg-jivana-accent/10"
                          onClick={() => handleOpenRecipe(dish.dish)}
                        >
                          View Recipe
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-jivana-text-slate-700 mt-2">
                  {store.timestamps?.[cat] ? `Updated ${formatTimeAgo(store.timestamps[cat]!)}`
                  : "Never updated"}
                </p>
              </TabsContent>
            ))}

            {/* All tab shows everything (no dedicated Refresh here; use the top Refresh for AI update) */}
            <TabsContent value="All" className="mt-4">
              <ul className="space-y-2">
                {(["Breakfast", "Lunch", "Dinner", "Snacks"] as Category[])
                  .flatMap((c) => store.recommendations[c] ?? [])
                  .map((dish, index) => (
                    <li
                      key={`all-${index}-${dish.dish}`}
                      className="p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-semibold text-jivana-text-slate-900">{dish.dish}</h4>
                          <p className="text-jivana-text-slate-700 text-sm">{dish.nutrition}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-jivana-accent hover:bg-jivana-accent/10"
                          onClick={() => handleOpenRecipe(dish.dish)}
                        >
                          View Recipe
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recipe Dialog */}
      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="sm:max-w-[560px] bg-jivana-card rounded-2xl border border-jivana-text-slate-700/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-jivana-primary">
              {recipeDish || "Recipe"}
            </DialogTitle>
          </DialogHeader>

          {recipeLoading ? (
            <p className="text-jivana-text-slate-700 italic">Fetching steps…</p>
          ) : recipeData ? (
            <div className="space-y-4 text-jivana-text-slate-900">
              <div className="text-sm text-jivana-text-slate-700">
                Serves: <span className="font-medium">{recipeData.serves}</span> • Prep:{" "}
                <span className="font-medium">{recipeData.time.prep}</span> • Cook:{" "}
                <span className="font-medium">{recipeData.time.cook}</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-jivana-accent">Ingredients</h4>
                <ul className="list-disc ml-5 space-y-1 text-sm">
                  {recipeData.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-jivana-accent">Steps</h4>
                <ol className="list-decimal ml-5 space-y-1 text-sm">
                  {recipeData.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-jivana-text-slate-700 italic">No recipe available.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
