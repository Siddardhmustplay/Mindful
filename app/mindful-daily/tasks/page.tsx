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

interface Task {
  id: string
  title: string
  priority: "High" | "Medium" | "Low"
  status: "todo" | "completed"
}

interface Job {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  title: string
}

export default function TasksPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"High" | "Medium" | "Low">("Medium")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState("")
  const [editingTaskPriority, setEditingTaskPriority] = useState<"High" | "Medium" | "Low">("Medium")

  const [jobs, setJobs] = useState<Job[]>([])
  const [newJobDate, setNewJobDate] = useState("")
  const [newJobTime, setNewJobTime] = useState("")
  const [newJobTitle, setNewJobTitle] = useState("")
  const [showAddJobForm, setShowAddJobForm] = useState(false)

  const [notepadContent, setNotepadContent] = useState("")

  const loadTasks = useCallback(() => {
    setTasks(getLocalStorageItem("jivana-tasks", []))
  }, [])

  const loadJobs = useCallback(() => {
    setJobs(getLocalStorageItem("jivana-jobs", []))
  }, [])

  const loadNotepad = useCallback(() => {
    setNotepadContent(getLocalStorageItem("jivana-notepad", ""))
  }, [])

  useEffect(() => {
    loadTasks()
    loadJobs()
    loadNotepad()
  }, [loadTasks, loadJobs, loadNotepad])

  // --- Task Management ---
  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") {
      toast({ title: "Task title cannot be empty.", variant: "destructive" })
      return
    }
    const newId = `task-${Date.now()}`
    const newTask: Task = { id: newId, title: newTaskTitle.trim(), priority: newTaskPriority, status: "todo" }
    const updatedTasks = [...tasks, newTask]
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    setNewTaskTitle("")
    setNewTaskPriority("Medium")
    toast({ title: "Task added!", description: newTask.title })
  }

  const handleToggleTaskStatus = (id: string, checked: boolean) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, status: checked ? "completed" : "todo" } : task,
    )
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    toast({
      title: `Task ${checked ? "completed" : "reopened"}!`,
      description: updatedTasks.find((t) => t.id === id)?.title,
    })
  }

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
    setEditingTaskPriority(task.priority)
  }

  const handleSaveTask = (id: string) => {
    if (editingTaskTitle.trim() === "") {
      toast({ title: "Task title cannot be empty.", variant: "destructive" })
      return
    }
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, title: editingTaskTitle.trim(), priority: editingTaskPriority } : task,
    )
    setTasks(updatedTasks)
    setLocalStorageItem("jivana-tasks", updatedTasks)
    setEditingTaskId(null)
    toast({ title: "Task updated!", description: editingTaskTitle })
  }

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      const updatedTasks = tasks.filter((task) => task.id !== id)
      setTasks(updatedTasks)
      setLocalStorageItem("jivana-tasks", updatedTasks)
      toast({ title: "Task deleted!", variant: "destructive" })
    }
  }

  const getPriorityColor = (priority: "High" | "Medium" | "Low") => {
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

  // --- Job Schedule Management ---
  const handleAddJob = () => {
    if (newJobTitle.trim() === "" || newJobDate.trim() === "" || newJobTime.trim() === "") {
      toast({ title: "All job fields are required.", variant: "destructive" })
      return
    }
    const newId = `job-${Date.now()}`
    const newJob: Job = { id: newId, title: newJobTitle.trim(), date: newJobDate, time: newJobTime }
    const updatedJobs = [...jobs, newJob].sort((a, b) => {
      const dateTimeA = new Date(`${a.date}T${a.time}`)
      const dateTimeB = new Date(`${b.date}T${b.time}`)
      return dateTimeA.getTime() - dateTimeB.getTime()
    })
    setJobs(updatedJobs)
    setLocalStorageItem("jivana-jobs", updatedJobs)
    setNewJobTitle("")
    setNewJobDate("")
    setNewJobTime("")
    setShowAddJobForm(false)
    toast({ title: "Job scheduled!", description: newJob.title })
  }

  const handleDeleteJob = (id: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      const updatedJobs = jobs.filter((job) => job.id !== id)
      setJobs(updatedJobs)
      setLocalStorageItem("jivana-jobs", updatedJobs)
      toast({ title: "Job deleted!", variant: "destructive" })
    }
  }

  // --- Notepad Management ---
  const handleSaveNotepad = () => {
    setLocalStorageItem("jivana-notepad", notepadContent)
    toast({ title: "Notes saved!", description: "Your notepad content has been updated." })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-white">Tasks</h1>

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
            onChange={(e) => setNewTaskPriority(e.target.value as "High" | "Medium" | "Low")}
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
                            onChange={(e) => setEditingTaskPriority(e.target.value as "High" | "Medium" | "Low")}
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
                              onChange={(e) => setEditingTaskPriority(e.target.value as "High" | "Medium" | "Low")}
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
