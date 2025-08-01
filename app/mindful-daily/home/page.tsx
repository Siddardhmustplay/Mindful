// app/mindful-daily/home/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { wisdomQuotes } from "@/lib/jivana-data"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { formatTimeAgo } from "@/lib/jivana-notifications"
import { useJivana } from "../components/jivana-provider" // Assuming this context exists

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

export default function HomePage() {
  const { refreshAllData } = useJivana()
  interface Wisdom {
    quote: string;
    author: string;
    timestamp: number;
  }
  const [dailyWisdom, setDailyWisdom] = useState<Wisdom>({ quote: "", author: "", timestamp: Date.now() });
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([]);

  const loadDailyWisdom = useCallback(() => {
    const storedWisdom = getLocalStorageItem<Wisdom>("jivana-daily-wisdom", { quote: "", author: "", timestamp: 0 });
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
    setTasks(getLocalStorageItem("jivana-tasks", []));
    setHabits(getLocalStorageItem("jivana-habits", []));
  }, []);

  useEffect(() => {
    loadDailyWisdom();
    loadTasksAndHabits();
  }, [loadDailyWisdom, loadTasksAndHabits]);

  const handleRefreshWisdom = () => {
    const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
    const newWisdom = { ...randomQuote, timestamp: Date.now() }
    setDailyWisdom(newWisdom)
    setLocalStorageItem("jivana-daily-wisdom", newWisdom)
  }

  // Calculate Today's Progress
  const completedTasksToday = tasks.filter((task) => task.status === "completed").length
  const totalTasks = tasks.length

  const today = new Date().toISOString().split("T")[0]
  const completedHabitsToday = habits.filter((habit) => habit.completionDates?.includes(today)).length
  const totalHabits = habits.length

  let overallProgress = 0
  if (totalTasks > 0 || totalHabits > 0) {
    const taskProgress = totalTasks > 0 ? completedTasksToday / totalTasks : 0
    const habitProgress = totalHabits > 0 ? completedHabitsToday / totalHabits : 0
    overallProgress = ((taskProgress + habitProgress) / (totalTasks > 0 && totalHabits > 0 ? 2 : 1)) * 100
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">
        Welcome back! Here’s your mindful journey for today
      </h1>

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

      {/* Today's Progress */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Today’s Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-jivana-text-slate-900 text-lg mb-4">
            You’ve completed {overallProgress.toFixed(0)}% of your daily mindful activities.
          </p>
          <Progress
            value={overallProgress}
            className="w-full h-2 bg-jivana-text-slate-700/20 bg-jivana-primary"
          />
        </CardContent>
      </Card>

      {/* Today's Checklist Preview */}
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
                .filter((habit) => !habit.completionDates?.includes(today))
                .map((habit) => (
                  <li key={habit.id} className="flex items-center text-jivana-text-slate-900">
                    <span className="mr-2 text-jivana-accent">•</span> {habit.name} (Habit)
                  </li>
                ))}
              {completedTasksToday > 0 && (
                <li className="text-jivana-success">
                  <span className="mr-2">✓</span> {completedTasksToday} task(s) completed!
                </li>
              )}
              {completedHabitsToday > 0 && (
                <li className="text-jivana-success">
                  <span className="mr-2">✓</span> {completedHabitsToday} habit(s) completed!
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
