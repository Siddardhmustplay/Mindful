// app/mindful-daily/habits/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { PlusCircle, CheckCircle, Undo2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useJivana } from "../components/jivana-provider"
import { supabase } from "@/lib/supabaseClient"

type HabitStatus = "active" | "done"

interface Habit {
  id: string
  name: string
  description: string
  targetFrequency: string // e.g., "7 days/week" or "Custom"
  startDate: string // YYYY-MM-DD
  completionDates: string[] // local-only history of YYYY-MM-DD
  streak: number
  status: HabitStatus
}

export default function HabitsPage() {
  const { toast } = useToast()
  const { walletId } = useJivana()

  const [habits, setHabits] = useState<Habit[]>([])
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false)
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitDescription, setNewHabitDescription] = useState("")
  const [newHabitFrequency, setNewHabitFrequency] = useState("7 days/week")
  const [newHabitStartDate, setNewHabitStartDate] = useState(new Date().toISOString().split("T")[0])

  // ---------- Helpers ----------
  const toHabitStatus = (s: unknown): HabitStatus => (s === "done" ? "done" : "active")

  const normalizeHabit = (h: Partial<Habit>): Habit => ({
    id: String(h.id ?? `temp-${Date.now()}`),
    name: String(h.name ?? ""),
    description: String(h.description ?? ""),
    targetFrequency: String(h.targetFrequency ?? "7 days/week"),
    startDate: String(h.startDate ?? new Date().toISOString().split("T")[0]),
    completionDates: Array.isArray(h.completionDates) ? h.completionDates : [],
    streak: typeof h.streak === "number" ? h.streak : 0,
    status: toHabitStatus(h.status),
  })

  // ---------- Local load + Supabase hydration ----------
  const loadHabits = useCallback(() => {
    const local = getLocalStorageItem<Habit[]>("jivana-habits", [])
    const normalized = (local ?? []).map((h) =>
      normalizeHabit({
        ...h,
        status: toHabitStatus(h.status),
      }),
    )
    setHabits(normalized)
  }, [])

  const fetchHabitsFromSupabase = useCallback(async () => {
    if (!walletId) return
    const { data, error } = await supabase
      .from("Habit")
      .select("id, habit_title, description, target, startdate, streak, Status")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error(error)
      toast({ title: "Failed to load habits from Supabase", variant: "destructive" })
      return
    }

    if (data) {
      setHabits((prevLocal) => {
        const merged: Habit[] = data.map((row: any) => {
          const localMatch = prevLocal.find((l) => l.id === String(row.id))
          return normalizeHabit({
            id: String(row.id),
            name: String(row.habit_title ?? localMatch?.name ?? ""),
            description: String(row.description ?? localMatch?.description ?? ""),
            targetFrequency: String(row.target ?? localMatch?.targetFrequency ?? "7 days/week"),
            startDate: String(row.startdate ?? localMatch?.startDate ?? new Date().toISOString().split("T")[0]),
            completionDates: localMatch?.completionDates ?? [],
            streak: typeof row.streak === "number" ? row.streak : (localMatch?.streak ?? 0),
            status: toHabitStatus(row.Status),
          })
        })
        setLocalStorageItem("jivana-habits", merged)
        return merged
      })
    }
  }, [walletId, toast])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  useEffect(() => {
    void fetchHabitsFromSupabase()
  }, [fetchHabitsFromSupabase])

  // ---------- Streak ----------
  const calculateStreak = (habit: Habit): number => {
    if (!habit.completionDates || habit.completionDates.length === 0) return 0

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    const todayString = currentDate.toISOString().split("T")[0]
    if (!habit.completionDates.includes(todayString)) {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0]
      if (habit.completionDates.includes(dateString)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  // ---------- Supabase sync helpers ----------
  const saveHabitToSupabase = async (h: Habit, tempId?: string) => {
    if (!walletId) return
    const { data, error } = await supabase
      .from("Habit")
      .insert([
        {
          wallet_id: walletId,
          habit_title: h.name,
          description: h.description,
          target: h.targetFrequency,
          startdate: h.startDate,
          todaysummary: "Pending",
          streak: 0,
          Status: "active",
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, habit_title, description, target, startdate, streak, Status")
      .single()

    if (error) {
      console.error(error)
      toast({ title: "Failed to save habit to Supabase", variant: "destructive" })
      return
    }

    if (data && tempId) {
      const realId = String(data.id)
      setHabits((prev): Habit[] => {
        const swapped = prev.map((x): Habit =>
          x.id === tempId
            ? {
                id: realId,
                name: String(data.habit_title ?? x.name),
                description: String(data.description ?? x.description),
                targetFrequency: String(data.target ?? x.targetFrequency),
                startDate: String(data.startdate ?? x.startDate),
                completionDates: x.completionDates,
                streak: typeof data.streak === "number" ? data.streak : x.streak,
                status: toHabitStatus(data.Status),
              }
            : x,
        )
        setLocalStorageItem("jivana-habits", swapped)
        return swapped
      })
    }
  }

  const updateHabitSummaryInSupabase = async (
    id: string,
    todaysummary: string,
    streak: number,
    status: HabitStatus,
  ) => {
    if (!walletId || id.startsWith("temp-")) return
    const dbId = Number(id)
    if (Number.isNaN(dbId)) return
    const { error } = await supabase
      .from("Habit")
      .update({
        todaysummary,
        streak,
        Status: status,
      })
      .eq("id", dbId)
      .eq("wallet_id", walletId)

    if (error) {
      console.error(error)
      toast({ title: "Failed to update habit in Supabase", variant: "destructive" })
    }
  }

  const deleteHabitInSupabase = async (id: string) => {
    if (!walletId || id.startsWith("temp-")) return
    const dbId = Number(id)
    if (Number.isNaN(dbId)) return
    const { error } = await supabase.from("Habit").delete().eq("id", dbId).eq("wallet_id", walletId)
    if (error) {
      console.error(error)
      toast({ title: "Failed to delete habit in Supabase", variant: "destructive" })
    }
  }

  // ---------- UI handlers ----------
  const handleAddHabit = async () => {
    if (newHabitName.trim() === "") {
      toast({ title: "Habit name cannot be empty.", variant: "destructive" })
      return
    }
    const tempId = `temp-${Date.now()}`
    const newHabit: Habit = {
      id: tempId,
      name: newHabitName.trim(),
      description: newHabitDescription.trim(),
      targetFrequency: newHabitFrequency,
      startDate: newHabitStartDate,
      completionDates: [],
      streak: 0,
      status: "active",
    }

    const updatedHabits: Habit[] = [...habits, newHabit]
    setHabits(updatedHabits)
    setLocalStorageItem("jivana-habits", updatedHabits)
    setIsAddHabitModalOpen(false)
    setNewHabitName("")
    setNewHabitDescription("")
    setNewHabitFrequency("7 days/week")
    setNewHabitStartDate(new Date().toISOString().split("T")[0])
    toast({ title: "Habit added!", description: newHabit.name })

    if (walletId) {
      await saveHabitToSupabase(newHabit, tempId)
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect on Home to sync habits with Supabase.",
        variant: "default",
      })
    }
  }

  const handleToggleHabitCompletion = async (id: string) => {
    const todayStr = new Date().toISOString().split("T")[0]
    let targetHabit: Habit | undefined
    let nowCompleted = false

    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const isCompletedToday = habit.completionDates.includes(todayStr)
        const newCompletionDates = isCompletedToday
          ? habit.completionDates.filter((d) => d !== todayStr)
          : [...habit.completionDates, todayStr].sort()
        nowCompleted = !isCompletedToday
        const updated: Habit = {
          ...habit,
          completionDates: newCompletionDates,
          status: nowCompleted ? "done" : "active",
        }
        targetHabit = updated
        return updated
      }
      return habit
    })

    setHabits(updatedHabits)
    setLocalStorageItem("jivana-habits", updatedHabits)

    const hName = updatedHabits.find((h) => h.id === id)?.name ?? "Habit"
    toast({ title: `Habit ${nowCompleted ? "completed" : "undone"}!`, description: hName })

    // Update streak + summary + Status in Supabase
    if (targetHabit) {
      const newStreak = calculateStreak(targetHabit)
      setHabits((prev): Habit[] => {
        const withStreak = prev.map((h): Habit =>
          h.id === targetHabit!.id ? { ...h, streak: newStreak, status: targetHabit!.status } : h,
        )
        setLocalStorageItem("jivana-habits", withStreak)
        return withStreak
      })

      const todaysummary = nowCompleted ? "Completed today" : "Pending today"
      await updateHabitSummaryInSupabase(id, todaysummary, newStreak, targetHabit.status)
    }
  }

  const handleDeleteHabit = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return

    const updatedHabits: Habit[] = habits.filter((habit) => habit.id !== id)
    setHabits(updatedHabits)
    setLocalStorageItem("jivana-habits", updatedHabits)
    toast({ title: "Habit deleted!", variant: "destructive" })

    await deleteHabitInSupabase(id)
  }

  // ---------- UI ----------
  const today = new Date().toISOString().split("T")[0]
  const completedTodayCount = habits.filter((habit) => habit.completionDates.includes(today)).length

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">Habits & Reminders</h1>
      <p className="text-jivana-text-slate-700 text-lg text-green">Track your daily routines and build consistency.</p>

      {/* Today's Summary */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-jivana-text-slate-900 text-lg">
            {completedTodayCount} of {habits.length} habits completed today.
          </p>
        </CardContent>
      </Card>

      {/* New Habit Modal Trigger */}
      <Dialog open={isAddHabitModalOpen} onOpenChange={setIsAddHabitModalOpen}>
        <DialogTrigger asChild>
          <Button className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
            <PlusCircle className="h-4 w-4 mr-2" /> New Habit
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-jivana-card text-jivana-text-slate-900 rounded-2xl border-jivana-text-slate-700/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-jivana-primary">Add New Habit</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="habit-name" className="text-sm font-medium">
                Habit Name
              </Label>
              <Input
                id="habit-name"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g., Daily Meditation"
                className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="habit-description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="habit-description"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                placeholder="e.g., 10 minutes of mindful breathing"
                className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="habit-frequency" className="text-sm font-medium">
                Target Frequency
              </Label>
              <select
                id="habit-frequency"
                value={newHabitFrequency}
                onChange={(e) => setNewHabitFrequency(e.target.value)}
                className="p-2 border rounded-md bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
              >
                <option value="7 days/week">7 days/week</option>
                <option value="5 days/week">5 days/week</option>
                <option value="3 days/week">3 days/week</option>
                <option value="Custom">Custom (not implemented)</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="habit-start-date" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="habit-start-date"
                type="date"
                value={newHabitStartDate}
                onChange={(e) => setNewHabitStartDate(e.target.value)}
                className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddHabit} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
              Add Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Habit List */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Your Habits</CardTitle>
        </CardHeader>
        <CardContent>
          {habits.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No habits added yet. Click "New Habit" to get started!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habits.map((habit) => {
                const isCompletedToday = habit.completionDates.includes(today)
                const streak = calculateStreak(habit)
                return (
                  <Card
                    key={habit.id}
                    className="bg-jivana-background rounded-xl shadow-sm border border-jivana-text-slate-700/10"
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-jivana-text-slate-900">{habit.name}</CardTitle>
                      <p className="text-jivana-text-slate-700 text-sm">{habit.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center text-sm text-jivana-text-slate-700">
                        <span>Target: {habit.targetFrequency}</span>
                        <span className="font-medium text-jivana-accent">Streak: {streak} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Button
                          onClick={() => handleToggleHabitCompletion(habit.id)}
                          className={cn(
                            "flex-1 mr-2",
                            isCompletedToday
                              ? "bg-jivana-danger hover:bg-jivana-danger/90"
                              : "bg-jivana-success hover:bg-jivana-success/90",
                          )}
                          size="sm"
                        >
                          {isCompletedToday ? (
                            <Undo2 className="h-4 w-4 mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {isCompletedToday ? "Undo" : "Complete for Today"}
                        </Button>
                        <Button
                          onClick={() => handleDeleteHabit(habit.id)}
                          variant="outline"
                          size="sm"
                          className="border-jivana-text-slate-700/20 text-jivana-text-slate-700 hover:bg-jivana-danger/10 hover:text-jivana-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
