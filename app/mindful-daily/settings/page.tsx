// app/mindful-daily/settings/page.tsx
"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { TimePicker } from "../components/ui/time-picker"
import { useJivana } from "../components/jivana-provider"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const { notificationSettings, updateNotificationSettings, sendTestNotification } = useJivana()

  const handleSaveSettings = () => {
    // Settings are automatically saved via JivanaProvider's useEffect
    toast({
      title: "Settings Saved!",
      description: "Your preferences have been updated.",
      variant: "default",
    })
  }

  const handleMasterToggle = async (checked: boolean) => {
    if (checked) {
      const permission = await Notification.requestPermission()
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
        })
        updateNotificationSettings({ notificationsEnabled: false }) // Still set to false for browser push
      }
    } else {
      updateNotificationSettings({ notificationsEnabled: false })
      toast({
        title: "Notifications Disabled",
        description: "No more daily digests or reminders.",
        variant: "default",
      })
    }
  }

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

  const handlePerFeatureFrequencyChange = (key: keyof typeof notificationSettings, value: string) => {
    updateNotificationSettings({ [key]: Number(value) })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold text-jivana-text-slate-900 text-green">Settings</h1>

      <Button onClick={handleSaveSettings} className="bg-jivana-primary hover:bg-jivana-primary/90 text-white">
        Save Settings
      </Button>

      {/* Master Notifications */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Master Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-notifications-master" className="text-base font-medium">
              Daily Notifications
            </Label>
            <Switch
              id="daily-notifications-master"
              checked={notificationSettings.notificationsEnabled}
              onCheckedChange={handleMasterToggle}
              className="data-[state=checked]:bg-jivana-primary data-[state=unchecked]:bg-jivana-text-slate-700"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="daily-digest-time" className="text-sm font-medium">
              Daily Digest Time
            </Label>
            <TimePicker
              id="daily-digest-time"
              value={notificationSettings.dailyDigestTime}
              onChange={handleTimeChange}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Include in Digest:</p>
            {Object.entries(notificationSettings.includeModules).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`digest-module-${key}`}
                  checked={value}
                  onCheckedChange={(checked) =>
                    handleModuleToggle(key as keyof typeof notificationSettings.includeModules, checked as boolean)
                  }
                  className="data-[state=checked]:bg-jivana-primary data-[state=checked]:text-white border-jivana-text-slate-700"
                />
                <Label htmlFor={`digest-module-${key}`} className="capitalize text-sm">
                  {key}
                </Label>
              </div>
            ))}
          </div>

          <Button
            onClick={sendTestNotification}
            variant="outline"
            className="w-full border-jivana-primary text-jivana-primary hover:bg-jivana-primary/10 bg-transparent"
          >
            Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences (per-feature frequencies) */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="workout-reminders" className="text-sm font-medium">
              Workout Reminders
            </Label>
            <Input
              id="workout-reminders"
              type="number"
              value={notificationSettings.workoutReminders}
              onChange={(e) => handlePerFeatureFrequencyChange("workoutReminders", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="social-media-breaks" className="text-sm font-medium">
              Social Media Breaks
            </Label>
            <Input
              id="social-media-breaks"
              type="number"
              value={notificationSettings.socialMediaBreaks}
              onChange={(e) => handlePerFeatureFrequencyChange("socialMediaBreaks", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="daily-quotes-wisdom" className="text-sm font-medium">
              Daily Quotes & Wisdom
            </Label>
            <Input
              id="daily-quotes-wisdom"
              type="number"
              value={notificationSettings.dailyQuotesWisdom}
              onChange={(e) => handlePerFeatureFrequencyChange("dailyQuotesWisdom", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="job-reminders" className="text-sm font-medium">
              Job Reminders
            </Label>
            <Input
              id="job-reminders"
              type="number"
              value={notificationSettings.jobReminders}
              onChange={(e) => handlePerFeatureFrequencyChange("jobReminders", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="healthy-food-suggestions" className="text-sm font-medium">
              Healthy Food Suggestions
            </Label>
            <Input
              id="healthy-food-suggestions"
              type="number"
              value={notificationSettings.healthyFoodSuggestions}
              onChange={(e) => handlePerFeatureFrequencyChange("healthyFoodSuggestions", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-progress-report" className="text-sm font-medium">
              Weekly Progress Report
            </Label>
            <Input
              id="weekly-progress-report"
              type="number"
              value={notificationSettings.weeklyProgressReport}
              onChange={(e) => handlePerFeatureFrequencyChange("weeklyProgressReport", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="english-vocabulary" className="text-sm font-medium">
              English Vocabulary
            </Label>
            <Input
              id="english-vocabulary"
              type="number"
              value={notificationSettings.englishVocabulary}
              onChange={(e) => handlePerFeatureFrequencyChange("englishVocabulary", e.target.value)}
              className="w-20 bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="bg-jivana-card rounded-2xl shadow-md border border-jivana-text-slate-700/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-jivana-primary">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-base font-medium">
              Dark Mode
            </Label>
            <Switch
              id="dark-mode"
              // This would typically be managed by a theme provider
              checked={false} // Placeholder
              onCheckedChange={() =>
                toast({
                  title: "Dark mode toggle (placeholder)",
                  description: "Feature not fully implemented.",
                  variant: "default",
                })
              }
              className="data-[state=checked]:bg-jivana-primary data-[state=unchecked]:bg-jivana-text-slate-700"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-effects" className="text-base font-medium">
              Sound Effects
            </Label>
            <Switch
              id="sound-effects"
              checked={false} // Placeholder
              onCheckedChange={() =>
                toast({
                  title: "Sound effects toggle (placeholder)",
                  description: "Feature not fully implemented.",
                  variant: "default",
                })
              }
              className="data-[state=checked]:bg-jivana-primary data-[state=unchecked]:bg-jivana-text-slate-700"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="data-backup" className="text-base font-medium">
              Data Backup
            </Label>
            <Switch
              id="data-backup"
              checked={false} // Placeholder
              onCheckedChange={() =>
                toast({
                  title: "Data backup toggle (placeholder)",
                  description: "Feature not fully implemented.",
                  variant: "default",
                })
              }
              className="data-[state=checked]:bg-jivana-primary data-[state=unchecked]:bg-jivana-text-slate-700"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
