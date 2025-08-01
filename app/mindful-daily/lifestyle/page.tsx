// app/mindful-daily/lifestyle/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { lifestyleTips } from "@/lib/jivana-data"
import { RefreshCw, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LifestyleTip {
  id: string
  category: string
  title: string
  description: string
  benefits: string[]
  learnMore?: string
  isUserAdded?: boolean
}

export default function LifestylePage() {
  const { toast } = useToast()
  const [currentTips, setCurrentTips] = useState<LifestyleTip[]>([])
  const [userLifestylePractices, setUserLifestylePractices] = useState<LifestyleTip[]>([])
  const [lastUpdated, setLastUpdated] = useState(Date.now())

  const [newPracticeTitle, setNewPracticeTitle] = useState("")
  const [newPracticeCategory, setNewPracticeCategory] = useState("")
  const [newPracticeDescription, setNewPracticeDescription] = useState("")

  const generateRandomTips = useCallback(() => {
    const shuffled = [...lifestyleTips].sort(() => 0.5 - Math.random())
    setCurrentTips(shuffled.slice(0, 2).map((tip) => ({ ...tip, id: `predefined-${tip.title.replace(/\s/g, "-")}` })))
    setLastUpdated(Date.now())
  }, [])

  const loadUserPractices = useCallback(() => {
    setUserLifestylePractices(getLocalStorageItem("jivana-user-lifestyle", []))
  }, [])

  useEffect(() => {
    generateRandomTips()
    loadUserPractices()
  }, [generateRandomTips, loadUserPractices])

  const handleRefresh = () => {
    generateRandomTips()
  }

  const handleAddPractice = () => {
    if (newPracticeTitle.trim() === "" || newPracticeCategory.trim() === "" || newPracticeDescription.trim() === "") {
      toast({ title: "All fields are required for a new practice.", variant: "destructive" })
      return
    }
    const newId = `user-${Date.now()}`
    const newPractice: LifestyleTip = {
      id: newId,
      title: newPracticeTitle.trim(),
      category: newPracticeCategory.trim(),
      description: newPracticeDescription.trim(),
      benefits: [], // User-added don't have predefined benefits
      isUserAdded: true,
    }
    const updatedPractices = [...userLifestylePractices, newPractice]
    setUserLifestylePractices(updatedPractices)
    setLocalStorageItem("jivana-user-lifestyle", updatedPractices)
    setNewPracticeTitle("")
    setNewPracticeCategory("")
    setNewPracticeDescription("")
    toast({ title: "New practice added!", description: newPractice.title })
  }

  const handleDeletePractice = (id: string) => {
    if (window.confirm("Are you sure you want to delete this practice?")) {
      const updatedPractices = userLifestylePractices.filter((p) => p.id !== id)
      setUserLifestylePractices(updatedPractices)
      setLocalStorageItem("jivana-user-lifestyle", updatedPractices)
      toast({ title: "Practice deleted!", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">
        Healthy Lifestyle — Daily recommendations for a balanced life
      </h1>

      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Tips</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefresh}
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
                      onClick={() => window.open(tip.learnMore, "_blank")}
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
