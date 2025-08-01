"use client"

import type React from "react"

import Link from "next/link"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Header() {
  const router = useRouter() // Add this line
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAppClick = () => {
    window.dispatchEvent(new CustomEvent("header_app_click")) // Updated analytics event
    router.push("/mindful-daily/home") // Navigate to the new Jivana app home page
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-graphite/80 backdrop-blur-sm p-4 shadow-lg border-b border-electric-purple/20">
      <nav className="container mx-auto flex items-center justify-between text-sm md:text-base font-body">
        <div className="flex-shrink-0">
          <Link href="#hero" className="font-display text-2xl text-neon-turquoise hover:text-white transition-colors">
            $RECK
          </Link>
        </div>
        <ul className="hidden md:flex space-x-6 lg:space-x-8">
          <li>
            <Link href="#about" className="text-white hover:text-neon-turquoise transition-colors">
              About
            </Link>
          </li>
          <li>
            <Link href="#how" className="text-white hover:text-neon-turquoise transition-colors">
              How
            </Link>
          </li>
          <li>
            <Link href="#lore" className="text-white hover:text-neon-turquoise transition-colors">
              Lore
            </Link>
          </li>
          <li>
            <Link href="#scrolls" className="text-white hover:text-neon-turquoise transition-colors">
              Scrolls
            </Link>
          </li>
          <li>
            <Link href="#leaderboard" className="text-white hover:text-neon-turquoise transition-colors">
              Leaderboard
            </Link>
          </li>
          <li>
            <Link href="#token" className="text-white hover:text-neon-turquoise transition-colors">
              Token
            </Link>
          </li>
          <li>
            <Link href="#faq" className="text-white hover:text-neon-turquoise transition-colors">
              FAQ
            </Link>
          </li>
          <li>
            <Link href="#legal" className="text-white hover:text-neon-turquoise transition-colors">
              Legal
            </Link>
          </li>
        </ul>
        <div className="hidden md:block">
          {/* Replaced Dialog with a direct ButtonGlow link */}
          <ButtonGlow variant="neon" onClick={handleAppClick}>
            App
          </ButtonGlow>
        </div>
        {/* Mobile menu - simplified for brevity, could be a hamburger icon */}
        <div className="md:hidden">
          <Dialog>
            <DialogTrigger asChild>
              <ButtonGlow variant="outline" size="icon">
                <MenuIcon className="h-6 w-6 text-neon-turquoise" />
                <span className="sr-only">Toggle navigation</span>
              </ButtonGlow>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px] bg-graphite text-white border-electric-purple">
              <DialogHeader>
                <DialogTitle className="text-neon-turquoise font-display">Navigation</DialogTitle>
              </DialogHeader>
              <nav className="flex flex-col gap-4 text-center">
                <Link
                  href="#about"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  About
                </Link>
                <Link
                  href="#how"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  How
                </Link>
                <Link
                  href="#lore"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  Lore
                </Link>
                <Link
                  href="#scrolls"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  Scrolls
                </Link>
                <Link
                  href="#leaderboard"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  Leaderboard
                </Link>
                <Link
                  href="#token"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  Token
                </Link>
                <Link
                  href="#faq"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  FAQ
                </Link>
                <Link
                  href="#legal"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-neon-turquoise transition-colors py-2"
                >
                  Legal
                </Link>
                <ButtonGlow
                  variant="neon"
                  onClick={() => {
                    handleAppClick() // Use the same handler for navigation
                    setIsModalOpen(false) // Close mobile menu after click
                  }}
                  className="mt-4"
                >
                  App
                </ButtonGlow>
              </nav>
            </DialogContent>
          </Dialog>
        </div>
      </nav>
    </header>
  )
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}
