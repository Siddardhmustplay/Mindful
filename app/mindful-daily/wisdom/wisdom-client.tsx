// app/mindful-daily/wisdom/wisdom-client.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { RefreshCw } from "lucide-react"
import type { WisdomStore } from "./page"

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

type RefreshDailyWord = () => Promise<DailyWord>
type RefreshCategory = (cat: CategoryKey) => Promise<Quote[]>

const EMPTY_STORE: WisdomStore = {
  dailyWord: undefined,
  quotes: { all: [], "bhagavad-gita": [], motivation: [], wisdom: [] },
  timestamps: {},
}

export default function WisdomClient({
  initialStore,
  refreshDailyWord,
  refreshCategory,
}: {
  initialStore: WisdomStore
  refreshDailyWord: RefreshDailyWord
  refreshCategory: RefreshCategory
}) {
  const [store, setStore] = useState<WisdomStore>(initialStore ?? EMPTY_STORE)
  const [activeTab, setActiveTab] = useState<CategoryKey>("all")
  const [loadingWord, setLoadingWord] = useState(false)
  const [loadingTab, setLoadingTab] = useState<CategoryKey | null>(null)

  const nowTs = () => Date.now()

  const quoteForTab = (tab: CategoryKey): Quote | null => {
    const list = store.quotes?.[tab] ?? []
    if (!list.length) return null
    const idx = new Date().getDate() % list.length
    return list[idx]
  }

  const handleRefreshWord = async () => {
    try {
      setLoadingWord(true)
      const word = await refreshDailyWord()
      setStore((prev) => ({
        ...prev,
        dailyWord: word,
        timestamps: { ...(prev.timestamps ?? {}), dailyWord: word.timestamp },
      }))
    } finally {
      setLoadingWord(false)
    }
  }

  const handleRefreshTab = async (cat: CategoryKey) => {
    try {
      setLoadingTab(cat)
      const quotes = await refreshCategory(cat)
      const ts = nowTs()
      setStore((prev) => ({
        ...prev,
        quotes: {
          ...prev.quotes,
          [cat]: quotes ?? [],
        },
        timestamps: { ...(prev.timestamps ?? {}), [cat]: ts },
      }))
    } finally {
      setLoadingTab(null)
    }
  }

  const currentQuote = quoteForTab(activeTab)
  const quoteUpdatedAt = store.timestamps?.[activeTab] ?? 0
  const wordUpdatedAt = store.timestamps?.dailyWord ?? store.dailyWord?.timestamp ?? nowTs()

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
        Daily Wisdom — Find inspiration in ancient wisdom and modern thought
      </h1>

      {/* Daily Word */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Word</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefreshWord}
            disabled={loadingWord}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {loadingWord ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          {!store.dailyWord ? (
            <p className="text-jivana-text-slate-700 italic">Loading daily word...</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-jivana-accent">
                {store.dailyWord.word}{" "}
                <span className="text-jivana-text-slate-700 text-base font-normal">
                  {store.dailyWord.phonetic}
                </span>
              </h3>
              <p className="text-jivana-text-slate-900 text-lg">{store.dailyWord.meaning}</p>
              {store.dailyWord.example && (
                <p className="text-jivana-text-slate-700 italic text-sm">Example: "{store.dailyWord.example}"</p>
              )}
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(wordUpdatedAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotes */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Quotes</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleRefreshTab(activeTab)}
              disabled={loadingTab === activeTab}
              className="border-jivana-text-slate-700/20"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {loadingTab === activeTab ? "Refreshing..." : "Refresh This Tab"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setActiveTab(v as CategoryKey)}>
            <TabsList className="grid w-full grid-cols-4 bg-jivana-background border border-jivana-text-slate-700/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger
                value="bhagavad-gita"
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Bhagavad Gita
              </TabsTrigger>
              <TabsTrigger
                value="motivation"
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Motivation
              </TabsTrigger>
              <TabsTrigger
                value="wisdom"
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Wisdom
              </TabsTrigger>
            </TabsList>

            {(["all", "bhagavad-gita", "motivation", "wisdom"] as CategoryKey[]).map((tab) => {
              const quote = tab === activeTab ? currentQuote : (store.quotes?.[tab]?.[0] ?? null)
              const updatedAt = store.timestamps?.[tab] ?? 0
              return (
                <TabsContent key={tab} value={tab} className="mt-4">
                  {!quote ? (
                    <p className="text-jivana-text-slate-700 italic">No quotes yet—try refresh.</p>
                  ) : (
                    <>
                      <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{quote.quote}"</p>
                      <p className="text-jivana-text-slate-700 text-sm">- {quote.author}</p>
                      <p className="text-jivana-text-slate-700 text-xs mt-2">
                        Updated {formatTimeAgo(updatedAt || nowTs())}
                      </p>
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
