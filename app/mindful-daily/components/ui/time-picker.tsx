"use client"

// app/mindful-daily/components/ui/time-picker.tsx
import type React from "react"
import { Input } from "@/components/ui/input" // Assuming shadcn Input is available

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (value: string) => void
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, ...props }) => {
  return (
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-jivana-background border-jivana-text-slate-700/20 text-jivana-text-slate-900 focus:ring-jivana-primary focus:border-jivana-primary"
      {...props}
    />
  )
}
