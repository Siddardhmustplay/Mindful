// app/mindful-daily/diet/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { dietRecommendations } from "@/lib/jivana-data"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { RefreshCw } from "lucide-react"

interface MealRecommendation {
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snacks"
  dish: string
  nutrition: string
  timestamp: number
}

export default function DietPage() {
  const [currentRecommendation, setCurrentRecommendation] = useState<MealRecommendation | null>(null)
  const [activeFilter, setActiveFilter] = useState<"All" | "Breakfast" | "Lunch" | "Dinner" | "Snacks">("All")

  const generateRecommendation = useCallback((filter: typeof activeFilter) => {
    const mealTypes = filter === "All" ? Object.keys(dietRecommendations) : [filter]
    const randomMealType = mealTypes[Math.floor(Math.random() * mealTypes.length)] as keyof typeof dietRecommendations
    const recommendationsForType = dietRecommendations[randomMealType]
    const randomDish = recommendationsForType[Math.floor(Math.random() * recommendationsForType.length)]

    const newRecommendation: MealRecommendation = {
      mealType: randomMealType,
      dish: randomDish.dish,
      nutrition: randomDish.nutrition,
      timestamp: Date.now(),
    }
    setCurrentRecommendation(newRecommendation)
    setLocalStorageItem("jivana-daily-diet", newRecommendation)
  }, [])

  useEffect(() => {
    const storedRecommendation = getLocalStorageItem("jivana-daily-diet", null)
    const today = new Date().toISOString().split("T")[0]

    if (storedRecommendation && new Date(storedRecommendation.timestamp).toISOString().split("T")[0] === today) {
      setCurrentRecommendation(storedRecommendation)
    } else {
      generateRecommendation("All")
    }
  }, [generateRecommendation])

  const handleRefresh = () => {
    generateRecommendation(activeFilter)
  }

  const handleFilterChange = (value: string) => {
    const newFilter = value as typeof activeFilter
    setActiveFilter(newFilter)
    generateRecommendation(newFilter)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">
        Healthy Diet — Vegetarian food recommendations for your mindful journey
      </h1>

      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today’s Recommendation</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
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
                onClick={() =>
                  window.open(`https://www.google.com/search?q=${currentRecommendation.dish} recipe`, "_blank")
                }
              >
                View Recipe
              </Button>
              <p className="text-jivana-text-slate-700 text-xs mt-2">
                Updated {formatTimeAgo(currentRecommendation.timestamp)}
              </p>
            </div>
          ) : (
            <p className="text-jivana-text-slate-700 italic">Generating today's recommendation...</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Explore Dishes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="All" onValueChange={handleFilterChange} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-jivana-background border border-jivana-text-slate-700/20">
              {["All", "Breakfast", "Lunch", "Dinner", "Snacks"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(dietRecommendations).map(([mealType, dishes]) => (
              <TabsContent key={mealType} value={mealType} className="mt-4">
                <ul className="space-y-2">
                  {dishes.map((dish, index) => (
                    <li
                      key={index}
                      className="p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                    >
                      <h3 className="text-lg font-medium text-jivana-text-slate-900">{dish.dish}</h3>
                      <p className="text-jivana-text-slate-700 text-sm">{dish.nutrition}</p>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
            <TabsContent value="All" className="mt-4">
              <ul className="space-y-2">
                {Object.values(dietRecommendations)
                  .flat()
                  .map((dish, index) => (
                    <li
                      key={index}
                      className="p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                    >
                      <h3 className="text-lg font-medium text-jivana-text-slate-900">{dish.dish}</h3>
                      <p className="text-jivana-text-slate-700 text-sm">{dish.nutrition}</p>
                    </li>
                  ))}
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
