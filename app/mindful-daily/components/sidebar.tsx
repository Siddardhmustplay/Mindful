// app/mindful-daily/components/sidebar.tsx
"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CheckSquare, BookOpen, Apple, Leaf, Type, BarChart, Settings, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const navItems = [
  { name: "Home", href: "/mindful-daily/home", icon: Home },
  { name: "Tasks", href: "/mindful-daily/tasks", icon: CheckSquare },
  { name: "Habits", href: "/mindful-daily/habits", icon: BookOpen },
  { name: "Wisdom", href: "/mindful-daily/wisdom", icon: BookOpen }, // Re-using icon for now
  { name: "Diet", href: "/mindful-daily/diet", icon: Apple },
  { name: "Lifestyle", href: "/mindful-daily/lifestyle", icon: Leaf },
  { name: "Words", href: "/mindful-daily/words", icon: Type },
  { name: "Stats", href: "/mindful-daily/stats", icon: BarChart },
  { name: "Settings", href: "/mindful-daily/settings", icon: Settings },
  { name: "Landing", href: "/", icon: Home }, // Add Landing button
]

export const Sidebar: React.FC = () => {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const NavLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <ul className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <li key={item.name}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center p-3 rounded-xl text-jivana-text-slate-700 hover:bg-jivana-primary/10 hover:text-jivana-primary transition-colors",
                isActive && "bg-jivana-primary text-white hover:bg-jivana-primary/90",
              )}
              onClick={onLinkClick}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-jivana-card border-r border-jivana-text-slate-700/10 p-6 shadow-lg fixed h-full z-40">
        <div className="mb-8 flex items-center">
          <img src="/placeholder.svg?height=32&width=32" alt="Jivana Logo" className="h-8 w-8 mr-2" />
          <span className="text-2xl font-bold text-jivana-primary">Mindful</span>
        </div>
        <nav className="flex-grow">
          <NavLinks />
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-jivana-card border-jivana-text-slate-700/10 shadow-md">
              <Menu className="h-6 w-6 text-jivana-primary" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-jivana-card p-6 border-r border-jivana-text-slate-700/10">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center">
                <img src="/placeholder.svg?height=32&width=32" alt="Jivana Logo" className="h-8 w-8 mr-2" />
                <span className="text-2xl font-bold text-jivana-primary">Jivana</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6 text-jivana-text-slate-700" />
                <span className="sr-only">Close navigation</span>
              </Button>
            </div>
            <nav className="flex-grow">
              <NavLinks onLinkClick={() => setIsMobileMenuOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
