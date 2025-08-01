// app/mindful-daily/stats/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getLocalStorageItem } from "@/lib/jivana-storage"

interface Task {
  id: string
  status: "todo" | "completed"
}

interface Habit {
  id: string
  completionDates: string[] // YYYY-MM-DD
}

export default function StatsPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  const loadData = useCallback(() => {
    setTasks(getLocalStorageItem("jivana-tasks", []))
    setHabits(getLocalStorageItem("jivana-habits", []))
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Calculate Overall Progress
  const completedTasks = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length

  const completedHabits = habits.filter((habit) => habit.completionDates.length > 0).length // Any completion
  const totalHabits = habits.length

  let overallProgress = 0
  if (totalTasks > 0 || totalHabits > 0) {
    const taskProgress = totalTasks > 0 ? completedTasks / totalTasks : 0
    const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0
    overallProgress = ((taskProgress + habitProgress) / (totalTasks > 0 && totalHabits > 0 ? 2 : 1)) * 100
  }

  // Placeholder for weekly completion (requires more complex date logic)
  const weeklyCompletion = 0
  const lastWeekCompletion = 0

  // Placeholder for other metrics
  const workoutsCompleted = 0
  const totalWorkouts = 0
  const socialMediaBreaksTaken = 0
  const totalSocialMediaBreaks = 0
  const mindfulReadingsCompleted = 0
  const totalMindfulReadings = 0

  const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">
        Progress & Statistics — Track your mindfulness journey and growth
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Overall Progress */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">{overallProgress.toFixed(0)}%</p>
            <Progress
              value={overallProgress}
              className="w-full h-2 bg-jivana-text-slate-700/20 bg-jivana-primary"
            />
          </CardContent>
        </Card>

        {/* Weekly Completion */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Weekly Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">{weeklyCompletion.toFixed(0)}%</p>
            <p className="text-jivana-text-slate-700 text-sm">vs last week {lastWeekCompletion.toFixed(0)}%</p>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">{taskCompletionPercentage.toFixed(0)}%</p>
            <p className="text-jivana-text-slate-700 text-sm">
              ({completedTasks}/{totalTasks} tasks completed)
            </p>
          </CardContent>
        </Card>

        {/* Workouts */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">
              {workoutsCompleted}/{totalWorkouts}
            </p>
            <p className="text-jivana-text-slate-700 text-sm">Times Completed (delta 0)</p>
          </CardContent>
        </Card>

        {/* Social Media Breaks */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Social Media Breaks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">
              {socialMediaBreaksTaken}/{totalSocialMediaBreaks}
            </p>
            <p className="text-jivana-text-slate-700 text-sm">Times Taken (delta 0)</p>
          </CardContent>
        </Card>

        {/* Mindful Readings */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Mindful Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-2">
              {mindfulReadingsCompleted}/{totalMindfulReadings}
            </p>
            <p className="text-jivana-text-slate-700 text-sm">Lessons Read (delta 0)</p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder Charts */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 text-jivana-text-slate-700 italic">
            Placeholder for charts (e.g., line graph of daily progress)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
