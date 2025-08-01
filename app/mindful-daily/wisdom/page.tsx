// app/mindful-daily/wisdom/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { wisdomQuotes, vocabularyWords } from "@/lib/jivana-data"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { RefreshCw } from "lucide-react"

interface DailyWord {
  word: string
  phonetic: string
  meaning: string
  example: string
  timestamp: number
}

export default function WisdomPage() {
  const [dailyWord, setDailyWord] = useState<DailyWord | null>(null)
  const [currentQuote, setCurrentQuote] = useState({ quote: "", author: "", timestamp: Date.now() })

  const loadDailyWord = useCallback(() => {
    const storedWord = getLocalStorageItem("jivana-daily-word", null)
    const today = new Date().toISOString().split("T")[0]

    if (storedWord && new Date(storedWord.timestamp).toISOString().split("T")[0] === today) {
      setDailyWord(storedWord)
    } else {
      const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)]
      const newWord = { ...randomWord, timestamp: Date.now() }
      setDailyWord(newWord)
      setLocalStorageItem("jivana-daily-word", newWord)
    }
  }, [])

  const loadRandomQuote = useCallback(() => {
    const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
    setCurrentQuote({ ...randomQuote, timestamp: Date.now() })
  }, [])

  useEffect(() => {
    loadDailyWord()
    loadRandomQuote()
  }, [loadDailyWord, loadRandomQuote])

  const handleRefresh = () => {
    loadDailyWord()
    loadRandomQuote()
  }

  const filterQuotes = (category: string) => {
    // This is a simplified filter. In a real app, quotes would have categories.
    // For now, we'll just show a random quote from the main list.
    // To implement proper filtering, wisdomQuotes would need a 'category' field.
    loadRandomQuote()
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">
        Daily Wisdom — Find inspiration in ancient wisdom and modern thought
      </h1>

      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Word</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefresh}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {dailyWord ? (
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-jivana-accent">
                {dailyWord.word}{" "}
                <span className="text-jivana-text-slate-700 text-base font-normal">{dailyWord.phonetic}</span>
              </h3>
              <p className="text-jivana-text-slate-900 text-lg">{dailyWord.meaning}</p>
              {dailyWord.example && (
                <p className="text-jivana-text-slate-700 italic text-sm">Example: "{dailyWord.example}"</p>
              )}
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(dailyWord.timestamp)}</p>
            </div>
          ) : (
            <p className="text-jivana-text-slate-700 italic">Loading daily word...</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-jivana-background border border-jivana-text-slate-700/20">
              <TabsTrigger
                value="all"
                onClick={() => filterQuotes("all")}
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="bhagavad-gita"
                onClick={() => filterQuotes("bhagavad-gita")}
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Bhagavad Gita
              </TabsTrigger>
              <TabsTrigger
                value="motivation"
                onClick={() => filterQuotes("motivation")}
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Motivation
              </TabsTrigger>
              <TabsTrigger
                value="wisdom"
                onClick={() => filterQuotes("wisdom")}
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Wisdom
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{currentQuote.quote}"</p>
              <p className="text-jivana-text-slate-700 text-sm">- {currentQuote.author}</p>
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(currentQuote.timestamp)}</p>
            </TabsContent>
            <TabsContent value="bhagavad-gita" className="mt-4">
              <p className="text-jivana-text-slate-700 italic">Quotes from Bhagavad Gita would appear here.</p>
              <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{currentQuote.quote}"</p>
              <p className="text-jivana-text-slate-700 text-sm">- {currentQuote.author}</p>
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(currentQuote.timestamp)}</p>
            </TabsContent>
            <TabsContent value="motivation" className="mt-4">
              <p className="text-jivana-text-slate-700 italic">Motivational quotes would appear here.</p>
              <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{currentQuote.quote}"</p>
              <p className="text-jivana-text-slate-700 text-sm">- {currentQuote.author}</p>
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(currentQuote.timestamp)}</p>
            </TabsContent>
            <TabsContent value="wisdom" className="mt-4">
              <p className="text-jivana-text-slate-700 italic">General wisdom quotes would appear here.</p>
              <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{currentQuote.quote}"</p>
              <p className="text-jivana-text-slate-700 text-sm">- {currentQuote.author}</p>
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(currentQuote.timestamp)}</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
