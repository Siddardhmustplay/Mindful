// app/mindful-daily/components/notification-bar.tsx
"use client"

import type React from "react"
import { useState } from "react"
import { Bell, ChevronDown, ChevronUp } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { TimePicker } from "./ui/time-picker"
import { useToast } from "@/hooks/use-toast"
import { useJivana } from "../components/jivana-provider" // Assuming this context exists

export const NotificationBar: React.FC = () => {
  const { toast } = useToast()
  const { notificationSettings, updateNotificationSettings, sendTestNotification } = useJivana()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleMasterToggle = async (checked: boolean) => {
    if (checked) {
      if (typeof Notification !== "undefined") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          toast({
            title: "Notifications Enabled",
          description: "Daily Digest and reminders will be sent.",
          variant: "default",
        })
        updateNotificationSettings({ notificationsEnabled: true })
      } else {
        toast({
          title: "Notification Permission Denied",
          description: "Falling back to in-app toast reminders.",
          variant: "destructive",
        });
        updateNotificationSettings({ notificationsEnabled: false }); // Still set to false for browser push
      }
        } else {
          updateNotificationSettings({ notificationsEnabled: false });
          toast({
            title: "Notifications Disabled",
            description: "No more daily digests or reminders.",
            variant: "default",
          });
        }
    } else {
      updateNotificationSettings({ notificationsEnabled: false });
      toast({
        title: "Notifications Disabled",
        description: "No more daily digests or reminders.",
        variant: "default",
      });
    }
  };

  const handleTimeChange = (time: string) => {
    updateNotificationSettings({ dailyDigestTime: time })
  }

  const handleModuleToggle = (module: keyof typeof notificationSettings.includeModules, checked: boolean) => {
    updateNotificationSettings({
      includeModules: {
        ...notificationSettings.includeModules,
        [module]: checked,
      },
    })
  }

  const handlePreviewNotification = () => {
    sendTestNotification()
    toast({
      title: "Test Notification Sent!",
      description: "Check your browser notifications or in-app toasts.",
      variant: "default",
    })
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-jivana-card p-3 rounded-2xl shadow-lg border border-jivana-text-slate-700/10 flex items-center space-x-3 text-jivana-text-slate-900">
      <Bell className="h-5 w-5 text-jivana-primary" />
      <span className="font-semibold text-sm">Daily Notifications</span>
      <Switch
        checked={notificationSettings.notificationsEnabled}
        onCheckedChange={handleMasterToggle}
        className="data-[state=checked]:bg-jivana-primary data-[state=unchecked]:bg-jivana-text-slate-700"
      />

      <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-jivana-text-slate-700/10"
            aria-label="Notification settings"
          >
            {isDropdownOpen ? (
              <ChevronUp className="h-5 w-5 text-jivana-text-slate-700" />
            ) : (
              <ChevronDown className="h-5 w-5 text-jivana-text-slate-700" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4 bg-jivana-card rounded-2xl shadow-xl border border-jivana-text-slate-700/10 text-jivana-text-slate-900 z-[60]">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-digest-time" className="text-sm font-medium">
                Daily Digest Time
              </Label>
              <TimePicker
                id="daily-digest-time"
                value={notificationSettings.dailyDigestTime}
                onChange={handleTimeChange}
              />
            </div>
            <Button
              onClick={handlePreviewNotification}
              variant="outline"
              className="w-full border-jivana-primary text-jivana-primary hover:bg-jivana-primary/10 bg-transparent"
            >
              Preview Notification
            </Button>
            <div className="space-y-2">
              <p className="text-sm font-medium">Include in Digest:</p>
              {Object.entries(notificationSettings.includeModules).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`module-${key}`}
                    checked={value}
                    onCheckedChange={(checked) =>
                      handleModuleToggle(key as keyof typeof notificationSettings.includeModules, checked as boolean)
                    }
                    className="data-[state=checked]:bg-jivana-primary data-[state=checked]:text-white border-jivana-text-slate-700"
                  />
                  <Label htmlFor={`module-${key}`} className="capitalize text-sm">
                    {key}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
