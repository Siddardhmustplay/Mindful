// app/mindful-daily/components/jivana-provider.tsx
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendNotification,
  generateDailyDigestContent,
  defaultNotificationSettings,
} from "@/lib/jivana-notifications"

interface JivanaContextType {
  notificationSettings: typeof defaultNotificationSettings
  updateNotificationSettings: (updates: Partial<typeof defaultNotificationSettings>) => void
  sendTestNotification: () => void
  // Add other global states/functions here as needed
  refreshAllData: () => void
}

const JivanaContext = createContext<JivanaContextType | undefined>(undefined)

export const JivanaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast()
  const [notificationSettings, setNotificationSettings] =
    useState<typeof defaultNotificationSettings>(defaultNotificationSettings)
  const notificationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings on mount
  useEffect(() => {
    setNotificationSettings(getNotificationSettings())
  }, [])

  // Save settings and reschedule notifications when settings change
  useEffect(() => {
    saveNotificationSettings(notificationSettings)
    if (notificationSettings.notificationsEnabled) {
      startNotificationScheduler()
    } else {
      stopNotificationScheduler()
    }
  }, [notificationSettings])

  const startNotificationScheduler = useCallback(() => {
    stopNotificationScheduler() // Clear any existing interval

    notificationIntervalRef.current = setInterval(() => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

      if (notificationSettings.notificationsEnabled && currentTime === notificationSettings.dailyDigestTime) {
        const digestContent = generateDailyDigestContent(notificationSettings)
        sendNotification("Jivana Daily Digest", {
          body: digestContent,
          icon: "/placeholder.svg?height=64&width=64",
        })
        // To prevent multiple notifications within the same minute,
        // we can set a flag or ensure the interval is long enough.
        // For simplicity, this will trigger once per minute if the time matches.
      }
      // Implement per-feature reminders here if needed, distributing them throughout the day.
    }, 60 * 1000) // Check every minute
  }, [notificationSettings])

  const stopNotificationScheduler = useCallback(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current)
      notificationIntervalRef.current = null
    }
  }, [])

  const updateNotificationSettings = useCallback((updates: Partial<typeof defaultNotificationSettings>) => {
    setNotificationSettings((prev) => {
      const newSettings = { ...prev, ...updates }
      if (updates.includeModules) {
        newSettings.includeModules = { ...prev.includeModules, ...updates.includeModules }
      }
      return newSettings
    })
  }, [])

  const sendTestNotification = useCallback(async () => {
    const permission = await requestNotificationPermission()
    const digestContent = generateDailyDigestContent(notificationSettings)

    if (permission === "granted") {
      sendNotification("Jivana Daily Digest (Test)", {
        body: digestContent,
        icon: "/placeholder.svg?height=64&width=64",
      })
    } else {
      toast({
        title: "Jivana Daily Digest (Test)",
        description: digestContent,
        variant: "default",
      })
    }
  }, [notificationSettings, toast])

  const refreshAllData = useCallback(() => {
    // This function would trigger re-fetches or re-randomizations for all pages
    // For now, it's a placeholder. Individual pages will handle their own refresh.
    toast({
      title: "Data Refreshed",
      description: "All dynamic content has been updated.",
      variant: "default",
    })
  }, [toast])

  return (
    <JivanaContext.Provider
      value={{
        notificationSettings,
        updateNotificationSettings,
        sendTestNotification,
        refreshAllData,
      }}
    >
      {children}
    </JivanaContext.Provider>
  )
}

export const useJivana = () => {
  const context = useContext(JivanaContext)
  if (context === undefined) {
    throw new Error("useJivana must be used within a JivanaProvider")
  }
  return context
}
