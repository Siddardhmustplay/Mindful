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

interface Habit {
  id: string
  name: string
  description: string
  targetFrequency: string // e.g., "7 days/week" or "Custom"
  startDate: string // YYYY-MM-DD
  completionDates: string[] // Array of YYYY-MM-DD
}

export default function HabitsPage() {
  const { toast } = useToast()
  const [habits, setHabits] = useState<Habit[]>([])
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false)
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitDescription, setNewHabitDescription] = useState("")
  const [newHabitFrequency, setNewHabitFrequency] = useState("7 days/week")
  const [newHabitStartDate, setNewHabitStartDate] = useState(new Date().toISOString().split("T")[0])

  const loadHabits = useCallback(() => {
    setHabits(getLocalStorageItem("jivana-habits", []))
  }, [])

  useEffect(() => {
    loadHabits()
  }, [loadHabits])

  const handleAddHabit = () => {
    if (newHabitName.trim() === "") {
      toast({ title: "Habit name cannot be empty.", variant: "destructive" })
      return
    }
    const newId = `habit-${Date.now()}`
    const newHabit: Habit = {
      id: newId,
      name: newHabitName.trim(),
      description: newHabitDescription.trim(),
      targetFrequency: newHabitFrequency,
      startDate: newHabitStartDate,
      streak: 0, // Streak will be computed dynamically or updated separately
      completionDates: [],
    }
    const updatedHabits = [...habits, newHabit]
    setHabits(updatedHabits)
    setLocalStorageItem("jivana-habits", updatedHabits)
    setIsAddHabitModalOpen(false)
    setNewHabitName("")
    setNewHabitDescription("")
    setNewHabitFrequency("7 days/week")
    setNewHabitStartDate(new Date().toISOString().split("T")[0])
    toast({ title: "Habit added!", description: newHabit.name })
  }

  const handleToggleHabitCompletion = (id: string) => {
    const today = new Date().toISOString().split("T")[0]
    const updatedHabits = habits.map((habit) => {
      if (habit.id === id) {
        const isCompletedToday = habit.completionDates.includes(today)
        const newCompletionDates = isCompletedToday
          ? habit.completionDates.filter((date) => date !== today)
          : [...habit.completionDates, today].sort() // Keep dates sorted
        return { ...habit, completionDates: newCompletionDates }
      }
      return habit
    })
    setHabits(updatedHabits)
    setLocalStorageItem("jivana-habits", updatedHabits)
    const habitName = updatedHabits.find((h) => h.id === id)?.name
    const isNowCompleted = updatedHabits.find((h) => h.id === id)?.completionDates.includes(today)
    toast({ title: `Habit ${isNowCompleted ? "completed" : "undone"}!`, description: habitName })
  }

  const handleDeleteHabit = (id: string) => {
    if (window.confirm("Are you sure you want to delete this habit?")) {
      const updatedHabits = habits.filter((habit) => habit.id !== id)
      setHabits(updatedHabits)
      setLocalStorageItem("jivana-habits", updatedHabits)
      toast({ title: "Habit deleted!", variant: "destructive" })
    }
  }

  const calculateStreak = (habit: Habit): number => {
    if (!habit.completionDates || habit.completionDates.length === 0) return 0

    let streak = 0
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Normalize to start of day

    // Check if today is completed
    const todayString = currentDate.toISOString().split("T")[0]
    if (!habit.completionDates.includes(todayString)) {
      // If not completed today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1)
    }

    while (true) {
      const dateString = currentDate.toISOString().split("T")[0]
      if (habit.completionDates.includes(dateString)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        // Check if the gap is due to a future date or a real break
        const habitStartDate = new Date(habit.startDate)
        habitStartDate.setHours(0, 0, 0, 0)

        if (currentDate.getTime() < habitStartDate.getTime()) {
          // We've gone before the start date, so streak ends here
          break
        }

        // If it's a day after the start date and not completed, streak breaks
        if (currentDate.getTime() >= habitStartDate.getTime()) {
          break
        }
      }
    }
    return streak
  }

  const today = new Date().toISOString().split("T")[0]
  const completedTodayCount = habits.filter((habit) => habit.completionDates.includes(today)).length

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">Habits & Reminders</h1>
      <p className="text-jivana-text-slate-700 text-lg text-white">Track your daily routines and build consistency.</p>

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
