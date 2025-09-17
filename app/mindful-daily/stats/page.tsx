// app/mindful-daily/stats/page.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { supabase } from "@/lib/supabaseClient"
import { useJivana } from "../components/jivana-provider"

interface Task {
  id: string
  status: "todo" | "completed"
}

interface Habit {
  id: string
  completionDates: string[] // YYYY-MM-DD
}

type HistoryPoint = { date: string; value: number } // value as percentage 0..100

// --- Helpers ---
const todayStr = () => new Date().toISOString().slice(0, 10)

// avg of array of numbers (safe)
function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

// returns ISO date strings for past n days including today (length n), oldest first
function lastNDays(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(d.getDate() - i)
    out.push(dd.toISOString().slice(0, 10))
  }
  return out
}

export default function StatsPage() {
  const { walletId } = useJivana()

  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [history, setHistory] = useState<HistoryPoint[]>([]) // 30-day rolling

  // Load local data
  const loadLocal = useCallback(() => {
    setTasks(getLocalStorageItem<Task[]>("jivana-tasks", []))
    setHabits(getLocalStorageItem<Habit[]>("jivana-habits", []))
    setHistory(getLocalStorageItem<HistoryPoint[]>("jivana-stats-history", []))
  }, [])

  useEffect(() => {
    loadLocal()
  }, [loadLocal])

  // Optionally hydrate history from Supabase (if exists for this wallet)
  useEffect(() => {
    const hydrate = async () => {
      if (!walletId) return
      const { data, error } = await supabase
        .from("stats")
        .select("ProgressOverTime")
        .eq("wallet_id", walletId)
        .single()

      if (!error && data?.ProgressOverTime && Array.isArray(data.ProgressOverTime)) {
        // Merge remote history with local by date, prefer local for today's value
        const remote: HistoryPoint[] = data.ProgressOverTime
        const map = new Map<string, number>()
        remote.forEach((p) => map.set(p.date, p.value))
        history.forEach((p) => map.set(p.date, p.value)) // local wins for overlapping days
        const merged = Array.from(map.entries())
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => (a.date < b.date ? -1 : 1))
          .slice(-30)

        setHistory(merged)
        setLocalStorageItem("jivana-stats-history", merged)
      }
    }
    void hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletId])

  // ---------- Derived Metrics ----------
  const {
    overallProgress,
    taskCompletionPercentage,
    weeklyCompletion,
    lastWeekCompletion,
    progressSeries, // normalized 30-day series (dates + values)
  } = useMemo(() => {
    // Tasks
    const completedTasks = tasks.filter((t) => t.status === "completed").length
    const totalTasks = tasks.length
    const taskCompletionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Habits: proxy — proportion of habits with any completion (you can refine later)
    const completedHabits = habits.filter((h) => h.completionDates.length > 0).length
    const totalHabits = habits.length

    let overallProgress = 0
    if (totalTasks > 0 || totalHabits > 0) {
      const taskProgress = totalTasks > 0 ? completedTasks / totalTasks : 0
      const habitProgress = totalHabits > 0 ? completedHabits / totalHabits : 0
      overallProgress = ((taskProgress + habitProgress) / (totalTasks > 0 && totalHabits > 0 ? 2 : 1)) * 100
    }

    // Build a normalized 30-day series from current history, ensuring we have slots for last 30 days.
    const dates30 = lastNDays(30)
    const histMap = new Map(history.map((p) => [p.date, p.value as number]))
    const series: HistoryPoint[] = dates30.map((d) => ({
      date: d,
      value: Number(histMap.get(d) ?? 0),
    }))

    // Weekly completion (average of last 7 days) vs previous 7 days (simple)
    const last7 = series.slice(-7).map((p) => p.value)
    const prev7 = series.slice(-14, -7).map((p) => p.value)
    const weeklyCompletion = avg(last7)
    const lastWeekCompletion = avg(prev7)

    return {
      overallProgress,
      taskCompletionPercentage,
      weeklyCompletion,
      lastWeekCompletion,
      progressSeries: series,
    }
  }, [tasks, habits, history])

  // ---------- Maintain rolling 30-day local history ----------
  useEffect(() => {
    const today = todayStr()
    const next = [
      ...history.filter((p) => p.date !== today),
      { date: today, value: Number(overallProgress.toFixed(2)) },
    ]
    const trimmed = next
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(-30)
    setHistory(trimmed)
    setLocalStorageItem("jivana-stats-history", trimmed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overallProgress])

  // ---------- Persist to Supabase (UPSERT on wallet_id) ----------
  useEffect(() => {
    if (!walletId) return

    const save = async () => {
      const row = {
        wallet_id: walletId,
        OverallProgress: Number(overallProgress.toFixed(2)),
        WeeklyCompletion: Number(weeklyCompletion.toFixed(2)),
        TaskCompletion: Number(taskCompletionPercentage.toFixed(2)),
        // These three are placeholders until you wire real modules (store as "X/Y")
        Workouts: `0/0`,
        SocialMediaBreaks: `0/0`,
        MindfulReadings: `0/0`,
        ProgressOverTime: progressSeries, // jsonb
      }

      const { error } = await supabase
        .from("stats")
        .upsert(row, { onConflict: "wallet_id" }) // update row when wallet already exists
      if (error) {
        console.error("[Supabase stats upsert] error:", error)
      }
    }

    // debounce a bit to avoid spamming
    const t = setTimeout(save, 300)
    return () => clearTimeout(t)
  }, [walletId, overallProgress, weeklyCompletion, taskCompletionPercentage, progressSeries])

  // ---------- Render ----------
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const totalTasks = tasks.length

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
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
            <Progress value={overallProgress} className="w-full h-2 bg-jivana-text-slate-700/20 bg-jivana-primary" />
          </CardContent>
        </Card>

        {/* Weekly Completion */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Weekly Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-1">{weeklyCompletion.toFixed(0)}%</p>
            <p className="text-jivana-text-slate-700 text-sm">vs last week {lastWeekCompletion.toFixed(0)}%</p>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Task Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-1">
              {taskCompletionPercentage.toFixed(0)}%
            </p>
            <p className="text-jivana-text-slate-700 text-sm">
              ({completedTasks}/{totalTasks} tasks completed)
            </p>
          </CardContent>
        </Card>

        {/* Workouts (placeholder) */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-1">0/0</p>
            <p className="text-jivana-text-slate-700 text-sm">Times Completed (delta 0)</p>
          </CardContent>
        </Card>

        {/* Social Media Breaks (placeholder) */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Social Media Breaks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-1">0/0</p>
            <p className="text-jivana-text-slate-700 text-sm">Times Taken (delta 0)</p>
          </CardContent>
        </Card>

        {/* Mindful Readings (placeholder) */}
        <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-jivana-primary">Mindful Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-jivana-text-slate-900 text-3xl font-bold mb-1">0/0</p>
            <p className="text-jivana-text-slate-700 text-sm">Lessons Read (delta 0)</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time (placeholder) */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 text-jivana-text-slate-700 italic">
            {progressSeries.length === 0 ? "No data yet" : `Saved ${progressSeries.length} day(s) of progress`}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
