"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { RefreshCw, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { useJivana } from "../components/jivana-provider"
import type { LifestyleTip } from "./page"
import { supabase } from "@/lib/supabaseClient"

type RefreshTips = () => Promise<LifestyleTip[]>

export default function LifestyleClient({
  initialTips,
  refreshTips,
}: {
  initialTips: LifestyleTip[]
  refreshTips: RefreshTips
}) {
  const { toast } = useToast()
  const { walletId } = useJivana()

  const [currentTips, setCurrentTips] = useState<LifestyleTip[]>(initialTips ?? [])
  const [userLifestylePractices, setUserLifestylePractices] = useState<LifestyleTip[]>([])
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now())

  // form inputs
  const [newPracticeTitle, setNewPracticeTitle] = useState("")
  const [newPracticeCategory, setNewPracticeCategory] = useState("")
  const [newPracticeDescription, setNewPracticeDescription] = useState("")

  // ---- Load user practices: prefer Supabase if wallet is connected ----
  const loadUserPractices = useCallback(async () => {
    if (walletId) {
      const { data, error } = await supabase
        .from("lifestyle")
        .select("id, wallet_id, lifestyle_title, category, description, created_at")
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error(error)
        toast({ title: "Failed to load lifestyle practices from Supabase", variant: "destructive" })
        // fallback to local
        setUserLifestylePractices(getLocalStorageItem("jivana-user-lifestyle", []))
        return
      }

      const rows = (data ?? []).map((r: any) => ({
        id: r.id as string,
        category: String(r.category),
        title: String(r.lifestyle_title),
        description: String(r.description),
        benefits: [],
        isUserAdded: true,
      })) as LifestyleTip[]

      setUserLifestylePractices(rows)
      setLocalStorageItem("jivana-user-lifestyle", rows)
    } else {
      // no wallet yet: just use local cache
      setUserLifestylePractices(getLocalStorageItem("jivana-user-lifestyle", []))
    }
  }, [walletId, toast])

  useEffect(() => {
    loadUserPractices()
    // also cache initial tips locally for resilience
    setLocalStorageItem("jivana-lifestyle-tips", currentTips)
  }, [loadUserPractices]) // eslint-disable-line

  // ---- Daily Tips: Refresh from AI ----
  const handleRefreshTips = async () => {
    try {
      const tips = await refreshTips()
      setCurrentTips(tips)
      setLastUpdated(Date.now())
      setLocalStorageItem("jivana-lifestyle-tips", tips)
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to refresh tips", variant: "destructive" })
    }
  }

  // ---- Add practice (Supabase + local) ----
  const handleAddPractice = async () => {
    if (newPracticeTitle.trim() === "" || newPracticeCategory.trim() === "" || newPracticeDescription.trim() === "") {
      toast({ title: "All fields are required for a new practice.", variant: "destructive" })
      return
    }

    // create local object for optimistic UI update
    const newPractice: LifestyleTip = {
      id: `temp-${Date.now()}`, // temp ID only for local state
      title: newPracticeTitle.trim(),
      category: newPracticeCategory.trim(),
      description: newPracticeDescription.trim(),
      benefits: [],
      isUserAdded: true,
    }

    // Optimistic update
    const updated = [...userLifestylePractices, newPractice]
    setUserLifestylePractices(updated)
    setLocalStorageItem("jivana-user-lifestyle", updated)

    // Reset form
    setNewPracticeTitle("")
    setNewPracticeCategory("")
    setNewPracticeDescription("")
    toast({ title: "New practice added!", description: newPractice.title })

    // Persist in Supabase if wallet connected
    if (walletId) {
      const { error } = await supabase.from("lifestyle").insert([
        {
          wallet_id: walletId,
          lifestyle_title: newPractice.title,
          category: newPractice.category,
          description: newPractice.description,
          // created_at defaults to now() in the database
        },
      ])

      if (error) {
        console.error(error)
        toast({ title: "Failed to save in Supabase", variant: "destructive" })
      }
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect your wallet on Home to sync your practices to the cloud.",
      })
    }
  }

  // ---- Delete practice (Supabase + local) ----
  const handleDeletePractice = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this practice?")) return

    const updated = userLifestylePractices.filter((p) => p.id !== id)
    setUserLifestylePractices(updated)
    setLocalStorageItem("jivana-user-lifestyle", updated)
    toast({ title: "Practice deleted!", variant: "destructive" })

    if (walletId) {
      const { error } = await supabase.from("lifestyle").delete().eq("id", id).eq("wallet_id", walletId)
      if (error) {
        console.error(error)
        toast({ title: "Failed to delete in Supabase", variant: "destructive" })
      }
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
        Healthy Lifestyle — Daily recommendations for a balanced life
      </h1>

      {/* Daily AI-generated Tips */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Tips</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefreshTips}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {currentTips.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No tips available.</p>
          ) : (
            <div className="space-y-6">
              {currentTips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-4 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                >
                  <p className="text-jivana-text-slate-700 text-sm font-medium mb-1">{tip.category}</p>
                  <h3 className="text-lg font-semibold text-jivana-text-slate-900 mb-2">{tip.title}</h3>
                  <p className="text-jivana-text-slate-700 text-base mb-3">{tip.description}</p>
                  {tip.benefits && tip.benefits.length > 0 && (
                    <div className="mb-3">
                      <p className="text-jivana-text-slate-900 font-medium text-sm">Benefits:</p>
                      <ul className="list-disc list-inside text-jivana-text-slate-700 text-sm">
                        {tip.benefits.map((benefit, i) => (
                          <li key={i}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tip.learnMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-jivana-accent text-jivana-accent hover:bg-jivana-accent/10 bg-transparent"
                      onClick={() => window.open(tip.learnMore!, "_blank")}
                    >
                      Learn more
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-jivana-text-slate-700 text-xs mt-4">Updated {formatTimeAgo(lastUpdated)}</p>
        </CardContent>
      </Card>

      {/* User-added Lifestyle Practices */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Your Practices</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Form to add new practice */}
          <div className="grid gap-4 mb-6 p-4 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10">
            <Label htmlFor="new-practice-title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="new-practice-title"
              placeholder="e.g., Evening Journaling"
              value={newPracticeTitle}
              onChange={(e) => setNewPracticeTitle(e.target.value)}
              className="bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />

            <Label htmlFor="new-practice-category" className="text-sm font-medium">
              Category
            </Label>
            <Input
              id="new-practice-category"
              placeholder="e.g., Reflection"
              value={newPracticeCategory}
              onChange={(e) => setNewPracticeCategory(e.target.value)}
              className="bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />

            <Label htmlFor="new-practice-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="new-practice-description"
              placeholder="Describe your practice..."
              value={newPracticeDescription}
              onChange={(e) => setNewPracticeDescription(e.target.value)}
              className="min-h-[80px] bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />

            <Button onClick={handleAddPractice} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
              <PlusCircle className="h-4 w-4 mr-2" /> Add New Practice
            </Button>
          </div>

          {/* List of user-added practices */}
          {userLifestylePractices.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No personal practices added yet.</p>
          ) : (
            <ul className="space-y-3">
              {userLifestylePractices.map((practice) => (
                <li
                  key={practice.id}
                  className="flex items-center justify-between p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-jivana-text-slate-700 text-sm font-medium">{practice.category}</p>
                    <h3 className="text-lg font-medium text-jivana-text-slate-900">{practice.title}</h3>
                    <p className="text-jivana-text-slate-700 text-sm">{practice.description}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeletePractice(practice.id)}
                    className="text-jivana-danger hover:bg-jivana-danger/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
