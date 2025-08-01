// app/mindful-daily/layout.tsx
import type React from "react"
import { Sidebar } from "./components/sidebar"
import { NotificationBar } from "./components/notification-bar"
import { StatusPill } from "./components/status-pill"
import { JivanaProvider } from "./components/jivana-provider"
import { Toaster } from "@/components/ui/toaster" // Assuming shadcn Toaster is available

export default function JivanaLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <JivanaProvider>
      <body className="flex min-h-screen bg-jivana-background text-jivana-text-slate-900">
        <Sidebar />
        <div className="flex-1 flex flex-col md:ml-64">
          {" "}
          {/* Adjust margin for sidebar */}
          <div className="flex justify-between items-center p-4 md:p-6 bg-jivana-background sticky top-0 z-30">
            <StatusPill status="online" message="Online — Data refreshing enabled" />
            <NotificationBar />
          </div>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <Toaster /> {/* Shadcn Toaster for notifications */}
      </body>
    </JivanaProvider>
  )
}
