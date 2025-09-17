// app/mindful-daily/tasks/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { Trash2, Edit, Save, PlusCircle, Calendar, NotebookPen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useJivana } from "../components/jivana-provider"
import { supabase } from "@/lib/supabaseClient"

type TaskStatus = "todo" | "completed"
type TaskPriority = "High" | "Medium" | "Low"

interface Task {
  id: string              // DB BIGINT ids stored as strings in UI
  title: string
  priority: TaskPriority
  status: TaskStatus
}

interface Job {
  id: string              // DB BIGINT id as string (temp-... before insert returns)
  date: string            // YYYY-MM-DD
  time: string            // HH:MM
  title: string
}

// Helpers to coerce types safely
function coerceStatus(s: unknown): TaskStatus {
  return s === "completed" ? "completed" : "todo"
}
function coercePriority(p: unknown): TaskPriority {
  return p === "High" || p === "Low" ? p : "Medium"
}

export default function TasksPage() {
  const { toast } = useToast()
  const { walletId: ctxWallet } = useJivana()
  const walletId: string | null = ctxWallet ?? getLocalStorageItem("jivana-wallet-id", null)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Medium")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [editingTaskPriority, setEditingTaskPriority] = useState<TaskPriority>("Medium")

  const [jobs, setJobs] = useState<Job[]>([])
  const [newJobDate, setNewJobDate] = useState("")
  const [newJobTime, setNewJobTime] = useState("")
  const [newJobTitle, setNewJobTitle] = useState("")
  const [showAddJobForm, setShowAddJobForm] = useState(false)

  const [notepadContent, setNotepadContent] = useState("")

  // ---------- Local loaders (and normalization) ----------
  const loadTasks = useCallback(() => {
    const local = getLocalStorageItem<Task[]>("jivana-tasks", [])
    const normalized: Task[] = (local ?? []).map((t) => ({
      id: String(t.id),
      title: t.title,
      priority: coercePriority(t.priority),
      status: coerceStatus(t.status),
    }))
    setTasks(normalized)
  }, [])

  const loadJobs = useCallback(() => {
    const local = getLocalStorageItem<Job[]>("jivana-jobs", [])
    setJobs((local ?? []).map((j) => ({ ...j, id: String(j.id) })))
  }, [])

  const loadNotepad = useCallback(() => {
    setNotepadContent(getLocalStorageItem("jivana-notepad", ""))
  }, [])

  // ---------- Supabase hydration ----------
  const fetchTasksFromSupabase = useCallback(async () => {
    if (!walletId) return
    const { data, error } = await supabase
      .from("tasks")
      .select("id, task_name, priority, status")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error(error)
      toast({ title: "Failed to load tasks from Supabase", variant: "destructive" })
      return
    }

    if (data) {
      const serverTasks: Task[] = data.map((row: any) => ({
        id: String(row.id),
        title: String(row.task_name ?? ""),
        priority: coercePriority(row.priority),
        status: coerceStatus(row.status),
      }))
      setTasks(serverTasks)
      setLocalStorageItem("jivana-tasks", serverTasks)
    }
  }, [walletId, toast])

  const fetchJobsFromSupabase = useCallback(async () => {
    if (!walletId) return
    const { data, error } = await supabase
      .from("jobs")
      .select("id, job_title, date, time")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error(error)
      toast({ title: "Failed to load jobs from Supabase", variant: "destructive" })
      return
    }

    if (data) {
      const serverJobs: Job[] = data.map((row: any) => ({
        id: String(row.id),
        title: String(row.job_title ?? ""),
        date: String(row.date ?? ""),
        time: String(row.time ?? ""),
      }))
      setJobs(serverJobs)
      setLocalStorageItem("jivana-jobs", serverJobs)
    }
  }, [walletId, toast])

  const fetchNotepadFromSupabase = useCallback(async () => {
    if (!walletId) return
    const { data, error } = await supabase
      .from("Notepad")
      .select("note")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error(error)
      toast({ title: "Failed to load notepad from Supabase", variant: "destructive" })
      return
    }

    const latest = data?.[0]?.note ?? ""
    setNotepadContent(latest)
    setLocalStorageItem("jivana-notepad", latest)
  }, [walletId, toast])

  useEffect(() => {
    loadTasks()
    loadJobs()
    loadNotepad()
    void fetchTasksFromSupabase()
    void fetchJobsFromSupabase()
    void fetchNotepadFromSupabase()
  }, [
    loadTasks,
    loadJobs,
    loadNotepad,
    fetchTasksFromSupabase,
    fetchJobsFromSupabase,
    fetchNotepadFromSupabase,
  ])

  // ---------- Task Management ----------
  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "") {
      toast({ title: "Task title cannot be empty.", variant: "destructive" })
      return
    }
    const tempId = `temp-${Date.now()}`
    const newTask: Task = { id: tempId, title: newTaskTitle.trim(), priority: newTaskPriority, status: "todo" }

    const optimistic: Task[] = [...tasks, newTask]
    setTasks(optimistic)
    setLocalStorageItem("jivana-tasks", optimistic)
    setNewTaskTitle("")
    setNewTaskPriority("Medium")
    toast({ title: "Task added!", description: newTask.title })

    if (walletId) {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            wallet_id: walletId,
            task_name: newTask.title,
            priority: newTask.priority,
            status: newTask.status,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id, task_name, priority, status")
        .single()

      if (error) {
        console.error(error)
        toast({ title: "Failed to save task to Supabase", variant: "destructive" })
        return
      }

      if (data) {
        const realId = String(data.id)
        setTasks((prev) => {
          const swapped: Task[] = prev.map((t) =>
            t.id === tempId
              ? {
                  id: realId,
                  title: String(data.task_name ?? t.title),
                  priority: coercePriority(data.priority),
                  status: coerceStatus(data.status),
                }
              : t,
          )
          setLocalStorageItem("jivana-tasks", swapped)
          return swapped
        })
      }
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect on Home to sync tasks with Supabase.",
        variant: "default",
      })
    }
  }

  const handleToggleTaskStatus = async (id: string, checked: boolean) => {
    const nextStatus: TaskStatus = checked ? "completed" : "todo"
    const updatedTasks: Task[] = tasks.map((task) =>
      task.id === id ? { ...task, status: nextStatus } : task,
    )
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    toast({
      title: `Task ${checked ? "completed" : "reopened"}!`,
      description: updatedTasks.find((t) => t.id === id)?.title,
    })

    if (walletId && !id.startsWith("temp-")) {
      const dbId = Number(id)
      if (!Number.isNaN(dbId)) {
        const { error } = await supabase
          .from("tasks")
          .update({ status: nextStatus })
          .eq("id", dbId)
          .eq("wallet_id", walletId)
        if (error) {
          console.error(error)
          toast({ title: "Failed to update task in Supabase", variant: "destructive" })
        }
      }
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
    setEditingTaskPriority(task.priority)
  }

  const handleSaveTask = async (id: string) => {
    if (editingTaskTitle.trim() === "") {
      toast({ title: "Task title cannot be empty.", variant: "destructive" })
      return
    }
    const updatedTasks: Task[] = tasks.map((task) =>
      task.id === id ? { ...task, title: editingTaskTitle.trim(), priority: editingTaskPriority } : task,
    )
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    setEditingTaskId(null)
    toast({ title: "Task updated!", description: editingTaskTitle })

    if (walletId && !id.startsWith("temp-")) {
      const dbId = Number(id)
      if (!Number.isNaN(dbId)) {
        const { error } = await supabase
          .from("tasks")
          .update({
            task_name: editingTaskTitle.trim(),
            priority: editingTaskPriority,
          })
          .eq("id", dbId)
          .eq("wallet_id", walletId)
        if (error) {
          console.error(error)
          toast({ title: "Failed to update task in Supabase", variant: "destructive" })
        }
      }
    }
  }

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return

    const updatedTasks: Task[] = tasks.filter((task) => task.id !== id)
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    toast({ title: "Task deleted!", variant: "destructive" })

    if (walletId && !id.startsWith("temp-")) {
      const dbId = Number(id)
      if (!Number.isNaN(dbId)) {
        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", dbId)
          .eq("wallet_id", walletId)
        if (error) {
          console.error(error)
          toast({ title: "Failed to delete task in Supabase", variant: "destructive" })
        }
      }
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "High":
        return "bg-jivana-danger text-white"
      case "Medium":
        return "bg-jivana-accent text-white"
      case "Low":
        return "bg-jivana-primary text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  // ---------- Job Schedule Management (now synced to Supabase) ----------
  const handleAddJob = async () => {
    if (newJobTitle.trim() === "" || newJobDate.trim() === "" || newJobTime.trim() === "") {
      toast({ title: "All job fields are required.", variant: "destructive" })
      return
    }
    const tempId = `temp-${Date.now()}`
    const newJob: Job = { id: tempId, title: newJobTitle.trim(), date: newJobDate, time: newJobTime }
    const updatedJobsLocal = [...jobs, newJob].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })

    setJobs(updatedJobsLocal)
    setLocalStorageItem("jivana-jobs", updatedJobsLocal)
    setNewJobTitle("")
    setNewJobDate("")
    setNewJobTime("")
    setShowAddJobForm(false)
    toast({ title: "Job scheduled!", description: newJob.title })

    if (walletId) {
      const { data, error } = await supabase
        .from("jobs")
        .insert([
          {
            wallet_id: walletId,
            job_title: newJob.title,
            date: newJob.date,
            time: newJob.time,
            created_at: new Date().toISOString(),
          },
        ])
        .select("id, job_title, date, time")
        .single()

      if (error) {
        console.error(error)
        toast({ title: "Failed to save job to Supabase", variant: "destructive" })
        return
      }

      if (data) {
        const realId = String(data.id)
        setJobs((prev) => {
          const replaced = prev
            .map((j) =>
              j.id === tempId
                ? { id: realId, title: String(data.job_title ?? j.title), date: String(data.date ?? j.date), time: String(data.time ?? j.time) }
                : j,
            )
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
          setLocalStorageItem("jivana-jobs", replaced)
          return replaced
        })
      }
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect on Home to sync jobs with Supabase.",
        variant: "default",
      })
    }
  }

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return

    const updatedJobsLocal = jobs.filter((job) => job.id !== id)
    setJobs(updatedJobsLocal)
    setLocalStorageItem("jivana-jobs", updatedJobsLocal)
    toast({ title: "Job deleted!", variant: "destructive" })

    if (walletId && !id.startsWith("temp-")) {
      const dbId = Number(id)
      if (!Number.isNaN(dbId)) {
        const { error } = await supabase
          .from("jobs")
          .delete()
          .eq("id", dbId)
          .eq("wallet_id", walletId)

        if (error) {
          console.error(error)
          toast({ title: "Failed to delete job in Supabase", variant: "destructive" })
        }
      }
    }
  }

  // ---------- Notepad Management (now synced to Supabase) ----------
  const handleSaveNotepad = async () => {
    setLocalStorageItem("jivana-notepad", notepadContent)
    toast({ title: "Notes saved!", description: "Your notepad content has been updated." })

    if (walletId) {
      const { error } = await supabase
        .from("Notepad")
        .insert([
          {
            wallet_id: walletId,
            note: notepadContent,
            created_at: new Date().toISOString(),
          },
        ])

      if (error) {
        console.error(error)
        toast({ title: "Failed to save note to Supabase", variant: "destructive" })
      }
    } else {
      toast({
        title: "Wallet not connected",
        description: "Connect on Home to sync notes with Supabase.",
        variant: "default",
      })
    }
  }

  // ---------- UI ----------
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">Tasks</h1>

      {/* New Task Input */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">New Task</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-grow bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
            className="p-2 border rounded-md bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <Button onClick={handleAddTask} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Your Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-jivana-background border border-jivana-text-slate-700/20">
              <TabsTrigger value="all" className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white">
                All
              </TabsTrigger>
              <TabsTrigger
                value="todo"
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                To Do
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-jivana-primary data-[state=active]:text-white"
              >
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              {tasks.length === 0 ? (
                <p className="text-jivana-text-slate-700 italic">No tasks added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                    >
                      {editingTaskId === task.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            className="flex-grow bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
                          />
                          <select
                            value={editingTaskPriority}
                            onChange={(e) => setEditingTaskPriority(e.target.value as TaskPriority)}
                            className="p-2 border rounded-md bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleSaveTask(task.id)}
                            className="text-jivana-success hover:bg-jivana-success/10"
                          >
                            <Save className="h-5 w-5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center flex-1">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.status === "completed"}
                            onCheckedChange={(checked) => handleToggleTaskStatus(task.id, checked as boolean)}
                            className="mr-3 data-[state=checked]:bg-jivana-primary data-[state=checked]:text-white border-jivana-text-slate-700"
                          />
                          <Label
                            htmlFor={`task-${task.id}`}
                            className={cn(
                              "text-jivana-text-slate-900 text-base",
                              task.status === "completed" && "line-through text-jivana-text-slate-700/70",
                            )}
                          >
                            {task.title}
                          </Label>
                          <span
                            className={cn(
                              "ml-3 px-2 py-0.5 rounded-full text-xs font-semibold",
                              getPriorityColor(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 ml-auto">
                        {editingTaskId !== task.id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditTask(task)}
                            className="text-jivana-accent hover:bg-jivana-accent/10"
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-jivana-danger hover:bg-jivana-danger/10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="todo" className="mt-4">
              {tasks.filter((t) => t.status === "todo").length === 0 ? (
                <p className="text-jivana-text-slate-700 italic">No tasks to do! Great job!</p>
              ) : (
                <ul className="space-y-3">
                  {tasks
                    .filter((t) => t.status === "todo")
                    .map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                      >
                        {editingTaskId === task.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              value={editingTaskTitle}
                              onChange={(e) => setEditingTaskTitle(e.target.value)}
                              className="flex-grow bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
                            />
                            <select
                              value={editingTaskPriority}
                              onChange={(e) => setEditingTaskPriority(e.target.value as TaskPriority)}
                              className="p-2 border rounded-md bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveTask(task.id)}
                              className="text-jivana-success hover:bg-jivana-success/10"
                            >
                              <Save className="h-5 w-5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center flex-1">
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={task.status === "completed"}
                              onCheckedChange={(checked) => handleToggleTaskStatus(task.id, checked as boolean)}
                              className="mr-3 data-[state=checked]:bg-jivana-primary data-[state=checked]:text-white border-jivana-text-slate-700"
                            />
                            <Label htmlFor={`task-${task.id}`} className="text-jivana-text-slate-900 text-base">
                              {task.title}
                            </Label>
                            <span
                              className={cn(
                                "ml-3 px-2 py-0.5 rounded-full text-xs font-semibold",
                                getPriorityColor(task.priority),
                              )}
                            >
                              {task.priority}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                          {editingTaskId !== task.id && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditTask(task)}
                              className="text-jivana-accent hover:bg-jivana-accent/10"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-jivana-danger hover:bg-jivana-danger/10"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {tasks.filter((t) => t.status === "completed").length === 0 ? (
                <p className="text-jivana-text-slate-700 italic">No completed tasks yet.</p>
              ) : (
                <ul className="space-y-3">
                  {tasks
                    .filter((t) => t.status === "completed")
                    .map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                      >
                        <div className="flex items-center flex-1">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.status === "completed"}
                            onCheckedChange={(checked) => handleToggleTaskStatus(task.id, checked as boolean)}
                            className="mr-3 data-[state=checked]:bg-jivana-primary data-[state=checked]:text-white border-jivana-text-slate-700"
                          />
                          <Label
                            htmlFor={`task-${task.id}`}
                            className={cn(
                              "text-jivana-text-slate-900 text-base line-through text-jivana-text-slate-700/70",
                            )}
                          >
                            {task.title}
                          </Label>
                          <span
                            className={cn(
                              "ml-3 px-2 py-0.5 rounded-full text-xs font-semibold",
                              getPriorityColor(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-jivana-danger hover:bg-jivana-danger/10"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Job Schedule Panel */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Job Schedule</CardTitle>
          <Button
            onClick={() => setShowAddJobForm(!showAddJobForm)}
            variant="outline"
            className="border-jivana-primary text-jivana-primary hover:bg-jivana-primary/10"
          >
            <Calendar className="h-4 w-4 mr-2" /> {showAddJobForm ? "Cancel" : "Schedule Work"}
          </Button>
        </CardHeader>
        <CardContent>
          {showAddJobForm && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10">
              <Input
                type="date"
                value={newJobDate}
                onChange={(e) => setNewJobDate(e.target.value)}
                className="bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
              />
              <Input
                type="time"
                value={newJobTime}
                onChange={(e) => setNewJobTime(e.target.value)}
                className="bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
              />
              <Input
                placeholder="Job title"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                className="col-span-full bg-white border-jivana-text-slate-700/20 text-jivana-text-slate-900"
              />
              <Button
                onClick={handleAddJob}
                className="col-span-full bg-jivana-primary hover:bg-jivana-primary/90 text-white"
              >
                Add Job
              </Button>
            </div>
          )}
          {jobs.length === 0 ? (
            <p className="text-jivana-text-slate-700 italic">No upcoming jobs scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-jivana-background rounded-lg border border-jivana-text-slate-700/10 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-jivana-text-slate-900 font-medium">{job.title}</p>
                    <p className="text-jivana-text-slate-700 text-sm">
                      {job.date} at {job.time}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteJob(job.id)}
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

      {/* Notepad Panel */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-jivana-primary">Notepad</CardTitle>
          <Button onClick={handleSaveNotepad} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
            <NotebookPen className="h-4 w-4 mr-2" /> Save Notes
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write your notes here..."
            value={notepadContent}
            onChange={(e) => setNotepadContent(e.target.value)}
            className="min-h-[150px] bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
          />
        </CardContent>
      </Card>
    </div>
  )
}
