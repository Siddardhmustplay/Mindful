// app/mindful-daily/home/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { wisdomQuotes } from "@/lib/jivana-data"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { useJivana } from "../components/jivana-provider"
import { connectPhantom, disconnectPhantom, getPhantomProvider } from "@/lib/phantom"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

interface Task {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  status: "todo" | "completed"
}
interface Habit {
  id: string
  name: string
  description: string
  targetFrequency: string
  streak: number
  completionDates: string[] // YYYY-MM-DD
}
interface Wisdom {
  quote: string
  author: string
  timestamp: number
}

export default function HomePage() {
  const router = useRouter()
  const { walletId, setWalletId } = useJivana()

  const [dailyWisdom, setDailyWisdom] = useState<Wisdom>({ quote: "", author: "", timestamp: Date.now() })
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  // ---------- Loaders ----------
  const loadDailyWisdom = useCallback(() => {
    const storedWisdom = getLocalStorageItem<Wisdom>("jivana-daily-wisdom", { quote: "", author: "", timestamp: 0 })
    const today = new Date().toISOString().split("T")[0]
    if (storedWisdom && new Date(storedWisdom.timestamp).toISOString().split("T")[0] === today) {
      setDailyWisdom(storedWisdom)
    } else {
      const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
      const newWisdom = { ...randomQuote, timestamp: Date.now() }
      setDailyWisdom(newWisdom)
      setLocalStorageItem("jivana-daily-wisdom", newWisdom)
    }
  }, [])

  const loadTasksAndHabits = useCallback(() => {
    setTasks(getLocalStorageItem<Task[]>("jivana-tasks", []))
    setHabits(getLocalStorageItem<Habit[]>("jivana-habits", []))
  }, [])

  useEffect(() => {
    loadDailyWisdom()
    loadTasksAndHabits()

    // Auto-reconnect Phantom if already trusted
    const tryTrusted = async () => {
      const provider = getPhantomProvider()
      if (!provider) return
      try {
        const { publicKey } = await provider.connect({ onlyIfTrusted: true })
        if (publicKey?.toString()) setWalletId(publicKey.toString())
      } catch {
        // ignore
      }
    }
    void tryTrusted()
  }, [loadDailyWisdom, loadTasksAndHabits, setWalletId])

  // ---------- UI handlers ----------
  const handleRefreshWisdom = () => {
    const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
    const newWisdom = { ...randomQuote, timestamp: Date.now() }
    setDailyWisdom(newWisdom)
    setLocalStorageItem("jivana-daily-wisdom", newWisdom)
  }

  const handleConnectWallet = async () => {
    try {
      const address = await connectPhantom()
      setWalletId(address)
    } catch (e: any) {
      alert(e?.message ?? "Failed to connect Phantom")
    }
  }

  const handleDisconnectWallet = async () => {
    await disconnectPhantom()
    setWalletId(null)
  }

  const gotoTasks = () => {
    router.push("/mindful-daily/tasks")
  }

  // ---------- Progress + Checklist ----------
  const today = new Date().toISOString().split("T")[0]
  const completedTasksToday = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length
  const completedHabitsToday = habits.filter((habit) => habit.completionDates?.includes(today)).length
  const totalHabits = habits.length

  let overallProgress = 0
  if (totalTasks > 0 || totalHabits > 0) {
    const taskProgress = totalTasks > 0 ? completedTasksToday / totalTasks : 0
    const habitProgress = totalHabits > 0 ? completedHabitsToday / totalHabits : 0
    overallProgress = ((taskProgress + habitProgress) / (totalTasks > 0 && totalHabits > 0 ? 2 : 1)) * 100
  }
  const todayProgressRounded = Math.round(overallProgress)

  // Compact checklist preview string
  const todoTasks = tasks.filter((t) => t.status === "todo").map((t) => t.title)
  const pendingHabits = habits.filter((h) => !h.completionDates?.includes(today)).map((h) => h.name)
  const checklistPreview =
    [
      todoTasks.length ? `Tasks: ${todoTasks.join(", ")}` : null,
      pendingHabits.length ? `Habits: ${pendingHabits.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || "All caught up 🎉"

  // ---------- Save to Supabase: Healthyapp (UPSERT by Wallet_id) ----------
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const saveHealthyAppRow = useCallback(async () => {
    if (!walletId) return
    try {
      const { error } = await supabase
        .from("Healthyapp")
        .upsert(
          [
            {
              // If your table is lowercased, rename these keys accordingly.
              Wallet_id: walletId,
              TodayProgress: todayProgressRounded,
              TodayChecklistPreview: checklistPreview,
            },
          ],
          { onConflict: "Wallet_id" } // requires a unique index/constraint on Wallet_id
        )

      if (error) {
        console.error("[Healthyapp upsert] error:", error)
      }
    } catch (e) {
      console.error("[Healthyapp upsert] exception:", e)
    }
  }, [walletId, todayProgressRounded, checklistPreview])

  // Debounced writer so we don't spam on quick changes
  useEffect(() => {
    if (!walletId) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveHealthyAppRow()
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [walletId, todayProgressRounded, checklistPreview, saveHealthyAppRow])

  // ---------- UI ----------
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">
          Welcome back! Here’s your mindful journey for today
        </h1>

        {/* Wallet Controls */}
        <div className="flex gap-2">
          {walletId ? (
            <>
              <Button variant="outline" className="text-xs">
                {walletId.slice(0, 6)}…{walletId.slice(-4)}
              </Button>
              <Button variant="destructive" onClick={handleDisconnectWallet}>
                Disconnect
              </Button>
              <Button onClick={gotoTasks} className="bg-jivana-primary text-white">
                Go to Tasks
              </Button>
            </>
          ) : (
            <Button onClick={handleConnectWallet} className="bg-jivana-primary text-white">
              Connect Phantom
            </Button>
          )}
        </div>
      </div>

      {/* Daily Wisdom */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Daily Wisdom</CardTitle>
          <Button
            variant="ghost"
            onClick={handleRefreshWisdom}
            className="text-jivana-text-slate-700 hover:text-jivana-primary"
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-jivana-text-slate-900 text-lg italic mb-2">"{dailyWisdom.quote}"</p>
          <p className="text-jivana-text-slate-700 text-sm">- {dailyWisdom.author}</p>
          <p className="text-jivana-text-slate-700 text-xs mt-2">Updated {formatTimeAgo(dailyWisdom.timestamp)}</p>
        </CardContent>
      </Card>

      {/* Today’s Progress */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today’s Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-jivana-text-slate-900 text-lg mb-4">
            You’ve completed {todayProgressRounded}% of your daily mindful activities.
          </p>
          <Progress value={todayProgressRounded} className="w-full h-2 bg-jivana-text-slate-700/20 bg-jivana-primary" />
        </CardContent>
      </Card>

      {/* Today’s Checklist Preview */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today’s Checklist Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 && habits.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No items yet — add Tasks and Habits to see them here.</p>
          ) : (
            <ul className="space-y-2">
              {tasks
                .filter((task) => task.status === "todo")
                .map((task) => (
                  <li key={task.id} className="flex items-center text-jivana-text-slate-900">
                    <span className="mr-2 text-jivana-accent">•</span> {task.title} (Task)
                  </li>
                ))}
              {habits
                .filter((h) => !h.completionDates?.includes(today))
                .map((habit) => (
                  <li key={habit.id} className="flex items-center text-jivana-text-slate-900">
                    <span className="mr-2 text-jivana-accent">•</span> {habit.name} (Habit)
                  </li>
                ))}
              {tasks.filter((t) => t.status === "completed").length > 0 && (
                <li className="text-jivana-success">
                  <span className="mr-2">✓</span>{" "}
                  {tasks.filter((t) => t.status === "completed").length} task(s) completed!
                </li>
              )}
              {habits.filter((h) => h.completionDates?.includes(today)).length > 0 && (
                <li className="text-jivana-success">
                  <span className="mr-2">✓</span>{" "}
                  {habits.filter((h) => h.completionDates?.includes(today)).length} habit(s) completed!
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
