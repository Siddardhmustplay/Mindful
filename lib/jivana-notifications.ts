// lib/jivana-notifications.ts
import { getLocalStorageItem, setLocalStorageItem } from "@/lib/jivana-storage"
import { wisdomQuotes, dietRecommendations, vocabularyWords, lifestyleTips } from "./jivana-data"

export interface NotificationSettings {
  notificationsEnabled: boolean
  dailyDigestTime: string // HH:MM format
  includeModules: {
    tasks: boolean
    habits: boolean
    wisdom: boolean
    diet: boolean
    lifestyle: boolean
    words: boolean
  }
  // Per-feature frequencies (for future use, but persist values)
  workoutReminders: number
  socialMediaBreaks: number
  dailyQuotesWisdom: number
  jobReminders: number
  healthyFoodSuggestions: number
  weeklyProgressReport: number
  englishVocabulary: number
}

export const defaultNotificationSettings: NotificationSettings = {
  notificationsEnabled: false,
  dailyDigestTime: "08:00",
  includeModules: {
    tasks: true,
    habits: true,
    wisdom: true,
    diet: true,
    lifestyle: true,
    words: true,
  },
  workoutReminders: 3,
  socialMediaBreaks: 4,
  dailyQuotesWisdom: 2,
  jobReminders: 1,
  healthyFoodSuggestions: 2,
  weeklyProgressReport: 1,
  englishVocabulary: 2,
}

export const getNotificationSettings = (): NotificationSettings => {
  return getLocalStorageItem("jivana-notification-settings", defaultNotificationSettings)
}

export const saveNotificationSettings = (settings: NotificationSettings) => {
  setLocalStorageItem("jivana-notification-settings", settings)
}

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification")
    return "denied" // Treat as denied if not supported
  }
  const permission = await Notification.requestPermission()
  return permission
}

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, options)
  } else {
    // Fallback to in-app toast if permission denied or not supported
    // This will be handled by the JivanaProvider's toast mechanism
    console.log("In-app toast fallback:", title, options?.body)
  }
}

export const generateDailyDigestContent = (settings: NotificationSettings) => {
  const content: string[] = []

  if (settings.includeModules.habits) {
    const habits = getLocalStorageItem("jivana-habits", [])
    const completedHabitsToday = habits.filter((h: any) =>
      h.completionDates?.includes(new Date().toISOString().split("T")[0]),
    ).length
    const totalHabits = habits.length
    if (totalHabits > 0) {
      content.push(`${totalHabits - completedHabitsToday} habits to complete`)
    }
  }

  if (settings.includeModules.tasks) {
    const tasks = getLocalStorageItem("jivana-tasks", [])
    const todoTasks = tasks.filter((t: any) => t.status === "todo").length
    if (todoTasks > 0) {
      content.push(`${todoTasks} tasks due`)
    }
  }

  if (settings.includeModules.wisdom) {
    const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)]
    content.push(`Today's wisdom: "${randomQuote.quote}"`)
  }

  if (settings.includeModules.diet) {
    const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snacks"]
    const randomMealType = mealTypes[Math.floor(Math.random() * mealTypes.length)]
    const recommendations = dietRecommendations[randomMealType as keyof typeof dietRecommendations]
    const randomDish = recommendations[Math.floor(Math.random() * recommendations.length)]
    content.push(`Diet tip: Try ${randomDish.dish} for ${randomMealType}.`)
  }

  if (settings.includeModules.words) {
    const randomWord = vocabularyWords[Math.floor(Math.random() * vocabularyWords.length)]
    content.push(`Today's word: ${randomWord.word} - ${randomWord.meaning}`)
  }

  if (settings.includeModules.lifestyle) {
    const randomTip = lifestyleTips[Math.floor(Math.random() * lifestyleTips.length)]
    content.push(`Lifestyle tip: ${randomTip.title}.`)
  }

  return content.length > 0 ? content.join(", ") : "Your mindful journey awaits!"
}

export const scheduleDailyDigest = (settings: NotificationSettings) => {
  const [hour, minute] = settings.dailyDigestTime.split(":").map(Number)
  const now = new Date()
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0)

  // If target time is in the past today, schedule for tomorrow
  if (targetTime.getTime() < now.getTime()) {
    targetTime.setDate(targetTime.getDate() + 1)
  }

  const delay = targetTime.getTime() - now.getTime()

  console.log(`Scheduling daily digest for ${targetTime.toLocaleTimeString()} (in ${delay / 1000} seconds)`)

  // Clear any existing daily digest timeout to prevent duplicates
  const existingTimeout = getLocalStorageItem("jivana-daily-digest-timeout", null)
  if (existingTimeout) {
    clearTimeout(existingTimeout)
  }

  const timeoutId = setTimeout(() => {
    const digestContent = generateDailyDigestContent(settings)
    sendNotification("Jivana Daily Digest", {
      body: digestContent,
      icon: "/placeholder.svg?height=64&width=64",
    })
    // Reschedule for the next day
    scheduleDailyDigest(settings)
  }, delay)

  setLocalStorageItem("jivana-daily-digest-timeout", timeoutId)
}

// Helper to format time for display
export const formatTimeAgo = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}
