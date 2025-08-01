// app/mindful-daily/components/status-pill.tsx
import type React from "react"
import { cn } from "@/lib/utils"

interface StatusPillProps {
  status: "online" | "offline"
  message: string
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, message }) => {
  const bgColor = status === "online" ? "bg-jivana-success" : "bg-jivana-danger"
  const textColor = "text-white"

  return (
    <div className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold", bgColor, textColor)}>
      <span className="relative flex h-2 w-2 mr-2">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === "online" ? "bg-jivana-success" : "bg-jivana-danger",
          )}
        ></span>
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            status === "online" ? "bg-jivana-success" : "bg-jivana-danger",
          )}
        ></span>
      </span>
      {message}
    </div>
  )
}
