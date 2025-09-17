"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { RefreshCw, Search, PlusCircle, Volume2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useJivana } from "../components/jivana-provider"
import { vocabularyWords } from "@/lib/jivana-data"
import { supabase } from "@/lib/supabaseClient"
import type { WordEntry } from "./page"

type RefreshFn = () => Promise<WordEntry>

export default function WordsClient({
  initialDailyWord,
  onRefreshDailyWord,
}: {
  initialDailyWord: WordEntry
  onRefreshDailyWord: RefreshFn
}) {
  const { toast } = useToast()
  const { walletId } = useJivana()

  const [dailyWord, setDailyWord] = useState<WordEntry | null>(initialDailyWord ?? null)
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  // user add form
  const [newWord, setNewWord] = useState("")
  const [newPhonetic, setNewPhonetic] = useState("")
  const [newMeaning, setNewMeaning] = useState("")
  const [newExample, setNewExample] = useState("")

  // Load + cache daily word (prefer today's cache if exists)
  const loadDailyWord = useCallback(() => {
    const stored = getLocalStorageItem<WordEntry | null>("jivana-daily-word", null)
    const today = new Date().toISOString().split("T")[0]
    if (stored && new Date(stored.timestamp).toISOString().split("T")[0] === today) {
      setDailyWord(stored)
    } else if (initialDailyWord) {
      setDailyWord(initialDailyWord)
      setLocalStorageItem("jivana-daily-word", initialDailyWord)
    }
  }, [initialDailyWord])

  // Build All Words: static vocab + user words + current AI word
  const allWords = useMemo(() => {
    const base = vocabularyWords.map((w) => ({
      id: `pre-${w.word}`,
      word: w.word,
      phonetic: w.phonetic || "",
      meaning: w.meaning,
      example: w.example || "",
    })) as WordEntry[]

    const users = getLocalStorageItem<WordEntry[]>("jivana-user-words", [])
    const ai = dailyWord ? [{ ...dailyWord, id: dailyWord.id || `ai-${dailyWord.word}` }] : []

    return [...base, ...users, ...ai]
  }, [dailyWord])

  useEffect(() => {
    loadDailyWord()
  }, [loadDailyWord])

  const handleRefreshDaily = async () => {
    try {
      const fresh = await onRefreshDailyWord()
      setDailyWord(fresh)
      setLocalStorageItem("jivana-daily-word", fresh)
      setLastUpdated(Date.now())
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to refresh daily word", variant: "destructive" })
    }
  }

  const handlePronounce = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      window.speechSynthesis.speak(utterance)
    } else {
      toast({
        title: "Speech synthesis not supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      })
    }
  }

  // Add new word: local + Supabase (words table)
  const handleAddWord = async () => {
    if (newWord.trim() === "" || newMeaning.trim() === "") {
      toast({ title: "Word and Meaning are required.", variant: "destructive" })
      return
    }

    const entry: WordEntry = {
      id: `user-${Date.now()}`,
      word: newWord.trim(),
      phonetic: newPhonetic.trim(),
      meaning: newMeaning.trim(),
      example: newExample.trim(),
      timestamp: Date.now(),
      isUserAdded: true,
    }

    // optimistic local store
    const current = getLocalStorageItem<WordEntry[]>("jivana-user-words", [])
    const updated = [...current, entry]
    setLocalStorageItem("jivana-user-words", updated)

    setNewWord("")
    setNewPhonetic("")
    setNewMeaning("")
    setNewExample("")
    toast({ title: "Word added!", description: entry.word })

    // Supabase insert (no `id`, DB generates; created_at defaults in DB)
    if (walletId) {
      const { error } = await supabase.from("words").insert([
        {
          wallet_id: walletId,
          word: entry.word,
          pronunciation: entry.phonetic,
          meaning: entry.meaning,
          example: entry.example || null,
          // created_at default in DB
        },
      ])
      if (error) {
        console.error(error)
        toast({ title: "Failed to save to Supabase", variant: "destructive" })
      }
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect your wallet on Home to sync your words to the cloud.",
      })
    }
  }

  const handleDeleteWord = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this word?")) return
    const current = getLocalStorageItem<WordEntry[]>("jivana-user-words", [])
    const updated = current.filter((w) => w.id !== id)
    setLocalStorageItem("jivana-user-words", updated)
    toast({ title: "Word deleted!", variant: "destructive" })
  }

  const filtered = useMemo(
    () =>
      allWords.filter(
        (w) =>
          w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.meaning.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [allWords, searchTerm],
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
        Vocabulary — Expand your knowledge with mindful words and concepts
      </h1>

      {/* Daily Word */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Word</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefreshDaily}
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
              <Button
                variant="outline"
                size="sm"
                className="mt-2 border-jivana-primary text-jivana-primary hover:bg-jivana-primary/10 bg-transparent"
                onClick={() => handlePronounce(dailyWord.word)}
              >
                <Volume2 className="h-4 w-4 mr-2" /> Play pronunciation
              </Button>
              <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(dailyWord.timestamp)}</p>
            </div>
          ) : (
            <p className="text-jivana-text-slate-700 italic">Loading daily word...</p>
          )}
        </CardContent>
      </Card>

      {/* All Words + Search */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">All Words</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-jivana-text-slate-700" />
            <Input
              placeholder="Search words..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No words found matching your search.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((word) => (
                <li
                  key={word.id}
                  className="p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-lg font-medium text-jivana-text-slate-900">
                      {word.word}{" "}
                      <span className="text-jivana-text-slate-700 text-sm font-normal">{word.phonetic}</span>
                    </h3>
                    <p className="text-jivana-text-slate-700 text-sm">{word.meaning}</p>
                    {word.example && <p className="text-jivana-text-slate-700 italic text-xs">"{word.example}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePronounce(word.word)}
                      className="text-jivana-primary hover:bg-jivana-primary/10"
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>
                    {word.isUserAdded && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteWord(word.id)}
                        className="text-jivana-danger hover:bg-jivana-danger/10"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add Word */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Add New Word</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-word" className="text-sm font-medium">
              Word
            </Label>
            <Input
              id="new-word"
              placeholder="e.g., Ahimsa"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-phonetic" className="text-sm font-medium">
              Pronunciation (Optional)
            </Label>
            <Input
              id="new-phonetic"
              placeholder="e.g., /əˈhɪmsɑː/"
              value={newPhonetic}
              onChange={(e) => setNewPhonetic(e.target.value)}
              className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-meaning" className="text-sm font-medium">
              Meaning
            </Label>
            <Textarea
              id="new-meaning"
              placeholder="e.g., Non-violence towards all living things."
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              className="min-h-[80px] bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-example" className="text-sm font-medium">
              Example (Optional)
            </Label>
            <Textarea
              id="new-example"
              placeholder="e.g., Practicing Ahimsa is a core principle in many spiritual traditions."
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              className="min-h-[80px] bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <Button onClick={handleAddWord} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Word
          </Button>
          <p className="text-xs text-jivana-text-slate-700 text-center">
            Your words are stored on this device; connect your wallet to sync to the cloud.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
