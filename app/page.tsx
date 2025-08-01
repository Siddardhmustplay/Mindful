"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ButtonGlow } from "@/components/ui/button-glow"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Header from "@/components/header"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// Placeholder for analytics event dispatch (as requested)
const dispatchAnalyticsEvent = (eventName: string, detail?: any) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
}

interface ScrollCardProps {
  id: string
  title: string
  confession: string
  upvotes: number
}

export default function Component() {
  const prefersReducedMotion = usePrefersReducedMotion()

  // HERO Section Ref
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroScrollProgress } = useScroll({ target: heroRef, offset: ["start end", "end start"] })
  const opacity = useTransform(heroScrollProgress, [0.8, 1], [1, 0])

  // ABOUT Section Ref
  const aboutRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: aboutScrollProgress } = useScroll({ target: aboutRef, offset: ["start end", "end start"] })
  const aboutImageY = useTransform(aboutScrollProgress, [0, 1], [-100, 100]) // Parallax for image

  // LORE Section Ref
  const loreVideoRef = useRef<HTMLVideoElement>(null)
  const loreSectionRef = useRef<HTMLDivElement>(null)
  const loreSectionInView = useInView(loreSectionRef, { once: false, amount: 0.5 }) // Detect when lore section is in view

  useEffect(() => {
    if (loreVideoRef.current) {
      if (prefersReducedMotion) {
        loreVideoRef.current.pause()
      } else {
        // We want lore.mp4 to be paused until user interaction
        loreVideoRef.current.pause()
      }
    }
  }, [prefersReducedMotion])

  // Mint a Scroll State
  const [isMintScrollModalOpen, setIsMintScrollModalOpen] = useState(false)
  const [scrolls, setScrolls] = useState<ScrollCardProps[]>([
    {
      id: "1",
      title: "My first rekt",
      confession:
        "Thought I was early on that rug pull. Lesson learned: always check the team. Lost 0.5 ETH, gained a story.",
      upvotes: 42,
    },
    {
      id: "2",
      title: "The liquidation special",
      confession:
        "Leveraged long at the absolute peak. Woke up to a zero balance. My wife still doesn't know. At least I can laugh now.",
      upvotes: 120,
    },
    {
      id: "3",
      title: "NFT diamond hands gone wrong",
      confession:
        "Held onto a JPEG that went from 10 ETH floor to 0.01 ETH. Should have taken profits. Now it's just a very expensive reminder.",
      upvotes: 88,
    },
  ])

  const handleMintScrollSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const confession = formData.get("confession") as string
    const nickname = formData.get("nickname") as string

    if (confession.trim() && nickname.trim()) {
      const newScroll: ScrollCardProps = {
        id: `temp-${Date.now()}`,
        title: nickname ? `${nickname}'s confession` : "Anonymous confession",
        confession: confession,
        upvotes: 0,
      }
      setScrolls((prev) => [newScroll, ...prev])
      setIsMintScrollModalOpen(false)
      dispatchAnalyticsEvent("scroll_submit", { confessionLength: confession.length })
    }
  }

  const handleScrollUpvote = (id: string) => {
    setScrolls((prev) => prev.map((scroll) => (scroll.id === id ? { ...scroll, upvotes: scroll.upvotes + 1 } : scroll)))
    dispatchAnalyticsEvent("scroll_upvote", { scrollId: id })
  }

  return (
    <div className="min-h-screen text-white font-body overflow-hidden">
      <Header />

      <main className="relative">
        {/* HERO Section */}
        <motion.section
          id="hero"
          ref={heroRef}
          style={{ opacity: prefersReducedMotion ? 1 : opacity }}
          className="relative w-full h-screen flex flex-col items-center justify-center text-center p-4 overflow-hidden"
        >
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250730_0903_Meme%20Guru%27s%20Crypto%20Throne_simple_compose_01k1cp80rkfm1sknafhspp0z5v-jpzfTZi70lAglf2cgugfDcAw2jbrYv.mp4"
              muted
              loop
              playsInline
              autoPlay={!prefersReducedMotion}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${prefersReducedMotion ? "opacity-100" : "opacity-70"}`}
              preload="auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-graphite to-transparent opacity-80" />
          </div>

          {/* Floating Coins */}
          {!prefersReducedMotion && (
            <>
              <motion.img
                src="/assets/a6.png"
                alt="Faint orbiting coin"
                className="absolute top-10 left-10 w-24 h-24 sm:w-32 sm:h-32 opacity-20 animate-coin-float"
                style={{ filter: "drop-shadow(0 0 10px #7A3BFF)" }}
              />
              <motion.img
                src="/assets/a6.png"
                alt="Faint orbiting coin"
                className="absolute bottom-20 right-20 w-24 h-24 sm:w-32 sm:h-32 opacity-20 animate-coin-float animation-delay-500ms"
                style={{ filter: "drop-shadow(0 0 10px #00F5FF)" }}
              />
            </>
          )}

          <div className="relative z-10 flex flex-col items-center">
            <p className="text-xl md:text-2xl text-neon-turquoise mb-4 font-body">
              We’ve all been rekt. Few of us reckon.
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-white drop-shadow-lg [text-shadow:0_0_15px_#00F5FF,0_0_30px_#7A3BFF]">
              $RECK — From Rekt to Reckoning
            </h1>
            <h2 className="text-2xl md:text-3xl mt-4 max-w-2xl text-white/90 font-body">
              A meme‑monastery for degens who learn in public.
            </h2>
            <div className="flex items-center space-x-4 mt-8 bg-graphite/60 border border-electric-purple/30 rounded-full px-6 py-3 text-lg font-mono">
              <span className="text-monk-orange">$RECK</span>
              <span className="text-white/70"> • </span>
              <span className="text-acid-green">Chain TBD</span>
              <span className="text-white/70"> • </span>
              <span className="text-neon-turquoise">Contract 0x…</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Dialog open={isMintScrollModalOpen} onOpenChange={setIsMintScrollModalOpen}>
                <DialogTrigger asChild>
                  <ButtonGlow
                    variant="neon"
                    size="lg"
                    className="px-8 py-3 text-lg"
                    onClick={() => {
                      dispatchAnalyticsEvent("hero_cta_click", { cta: "Mint a Scroll (Hero)" })
                      setIsMintScrollModalOpen(true)
                    }}
                  >
                    Mint a Scroll
                  </ButtonGlow>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-graphite text-white border-electric-purple">
                  <DialogHeader>
                    <DialogTitle className="text-neon-turquoise font-display">Mint Your Rekt Scroll</DialogTitle>
                    <DialogDescription className="text-white/80">
                      Share your funniest or realest loss. What you admit, you master.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleMintScrollSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <label htmlFor="modal-confession" className="text-sm font-medium text-white">
                        Your Confession (280 chars)
                      </label>
                      <Textarea
                        id="modal-confession"
                        name="confession"
                        placeholder="I bought the top because I thought it was different this time..."
                        maxLength={280}
                        className="bg-graphite/50 border-electric-purple/50 text-white focus:ring-neon-turquoise focus:border-neon-turquoise"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="modal-nickname" className="text-sm font-medium text-white">
                        Nickname
                      </label>
                      <Input
                        id="modal-nickname"
                        name="nickname"
                        placeholder="DegenChad69"
                        className="bg-graphite/50 border-electric-purple/50 text-white focus:ring-neon-turquoise focus:border-neon-turquoise"
                      />
                    </div>
                    <ButtonGlow type="submit" variant="neon" className="mt-4">
                      Submit Scroll
                    </ButtonGlow>
                  </form>
                  <p className="text-xs text-center text-white/60 mt-2">
                    Wallet connect arrives at launch. For now, share your Scroll and claim early clout.
                  </p>
                </DialogContent>
              </Dialog>

              <ButtonGlow
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg border-electric-purple text-electric-purple hover:text-white bg-transparent"
                onClick={() => {
                  dispatchAnalyticsEvent("hero_cta_click", { cta: "Read the Lore" })
                  document.getElementById("lore")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Read the Lore
              </ButtonGlow>
              <ButtonGlow
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg border-acid-green text-acid-green hover:text-white bg-transparent"
                onClick={() => {
                  dispatchAnalyticsEvent("social_click", { platform: "Community" })
                  // Placeholder for actual community links
                  window.open("https://twitter.com/reck_community", "_blank")
                }}
              >
                Join Community
              </ButtonGlow>
            </div>
            <p className="text-xs text-white/70 mt-4">Entertainment only. Not financial advice.</p>
          </div>
        </motion.section>

        {/* ABOUT / WHY Section */}
        <section
          id="about"
          ref={aboutRef}
          className="container mx-auto py-20 px-4 md:py-32 flex flex-col md:flex-row items-center gap-12 font-body"
        >
          <div className="md:w-1/2 relative min-h-[300px] md:min-h-[500px]">
            <motion.img
              src="/assets/a3.png"
              alt="Meditating raccoon with red and green laser tears and halo."
              className="absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_0_20px_#00F5FF]"
              style={prefersReducedMotion ? {} : { y: aboutImageY }}
              loading="lazy"
            />
          </div>
          <div className="md:w-1/2 text-left">
            <h2 className="text-4xl md:text-5xl font-display text-neon-turquoise mb-6">
              Everyone gets rekt—legends learn to reckon.
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-6 leading-relaxed">
              $RECK turns losses into lore. We laugh at the scars, share the lesson, and light up the wallet—together.
              The raccoon monk isn’t perfect; he’s practiced. His red eye remembers fear, his green eye rewards courage.
              The monastery is open; bring your Ls and leave with legend.
            </p>
            <p className="text-xl md:text-2xl text-coin-gold font-bold">
              Turn your Ls into lore. Share a Scroll, earn status, and help the next degen dodge your mistakes.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS Section */}
        <section id="how" className="container mx-auto py-20 px-4 md:py-32 text-center font-body">
          <h2 className="text-4xl md:text-5xl font-display text-electric-purple mb-12">
            How It Works: Confess. Reckon. Ascend.
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-graphite/70 p-6 rounded-lg border border-neon-turquoise/30 shadow-lg text-left">
              <h3 className="text-2xl font-display text-neon-turquoise mb-4">Confess</h3>
              <p className="text-white/80">
                Mint a Rekt Scroll with your funniest or realest loss. What you admit, you master.
              </p>
            </div>
            <div className="bg-graphite/70 p-6 rounded-lg border border-electric-purple/30 shadow-lg text-left">
              <h3 className="text-2xl font-display text-electric-purple mb-4">Reckon</h3>
              <p className="text-white/80">
                The community upvotes the most helpful/funniest scrolls. Weekly Reckon Drops share $RECK with top
                entries.
              </p>
            </div>
            <div className="bg-graphite/70 p-6 rounded-lg border border-monk-orange/30 shadow-lg text-left">
              <h3 className="text-2xl font-display text-monk-orange mb-4">Ascend</h3>
              <p className="text-white/80">
                Climb to the Chair of RECKoning—badges, shout‑outs, and art perks for teachers and entertainers.
              </p>
            </div>
          </div>
          <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden border-2 border-acid-green shadow-[0_0_30px_rgba(102,255,102,0.5)]">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250730_0903_Meme%20Guru%27s%20Crypto%20Throne_simple_compose_01k1cp80s0ey580sryyycjj2ye-c2uRPILue2dKAwkAuSiI9jmPKlA4OC.mp4"
              muted
              loop
              playsInline
              autoPlay={!prefersReducedMotion}
              className="w-full h-auto object-cover"
              preload="metadata"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-12">
            <ButtonGlow
              variant="neon"
              size="lg"
              onClick={() => {
                dispatchAnalyticsEvent("hero_cta_click", { cta: "Start Your Scroll" })
                document.getElementById("scrolls")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              Start Your Scroll
            </ButtonGlow>
            <ButtonGlow
              variant="outline"
              size="lg"
              className="border-monk-orange text-monk-orange hover:text-white bg-transparent"
              onClick={() => {
                dispatchAnalyticsEvent("hero_cta_click", { cta: "See the Throne" })
                document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              See the Throne
            </ButtonGlow>
          </div>
        </section>

        {/* LORE — SCROLLYTELLING STRIP Section */}
        <section id="lore" ref={loreSectionRef} className="py-20 px-4 md:py-32 font-body relative">
          <h2 className="text-4xl md:text-5xl font-display text-signal-red text-center mb-12">
            Lore — Scrollytelling Strip
          </h2>
          <div className="relative flex items-center justify-center py-10 bg-graphite/70 border-t border-b border-electric-purple/30 shadow-inner shadow-electric-purple/10">
            <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory lore-snap-container space-x-8 md:space-x-16 lg:space-x-24 px-4 md:px-16 py-8 w-full">
              {/* Frame 1: Awakening */}
              <motion.div
                className="lore-snap-item flex-shrink-0 w-80 md:w-96 p-4 rounded-lg bg-graphite/80 border border-monk-orange/50 shadow-md flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <h3 className="text-2xl font-display text-monk-orange mb-4">Awakening</h3>
                <img
                  src="/assets/a3.png"
                  alt="Meditating raccoon with red and green laser tears and halo."
                  className="w-48 h-auto mb-4 filter drop-shadow-[0_0_15px_#FF6A00]"
                  loading="lazy"
                />
                <p className="text-white/80">Pain became signal—two eyes, one purpose.</p>
              </motion.div>

              {/* Frame 2: Staff & Scrolls */}
              <motion.div
                className="lore-snap-item flex-shrink-0 w-80 md:w-96 p-4 rounded-lg bg-graphite/80 border border-acid-green/50 shadow-md flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <h3 className="text-2xl font-display text-acid-green mb-4">Staff & Scrolls</h3>
                <img
                  src="/assets/a2.png"
                  alt="Raccoon monk walking with a candlestick staff and glowing 'rekt' panels."
                  className="w-48 h-auto mb-4 filter drop-shadow-[0_0_15px_#66FF66]"
                  loading="lazy"
                />
                <p className="text-white/80">Candlesticks tamed. Losses archived into glowing Scrolls of RECK.</p>
              </motion.div>

              {/* Cutaway Video */}
              <motion.div
                className="lore-snap-item flex-shrink-0 w-96 md:w-[600px] p-4 rounded-lg bg-graphite/90 border border-signal-red/50 shadow-lg flex flex-col items-center justify-center transition-all duration-500 ease-in-out"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <h3 className="text-2xl font-display text-signal-red mb-4">The Reckoning</h3>
                <video
                  ref={loreVideoRef}
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250730_0905_Crypto%20Raccoon%20Guru_simple_compose_01k1cpbr6zekyv21dvw00h5jfa-dsGaviIPdnjVEfxW4KLPPGbNjGrwYN.mp4"
                  muted
                  playsInline
                  controls
                  className="w-full h-auto max-h-96 rounded-md shadow-md"
                  preload="metadata" // Only load metadata until user plays
                  onPlay={() => dispatchAnalyticsEvent("video_play_lore")}
                >
                  Your browser does not support the video tag.
                </video>
                <p className="text-sm text-white/70 mt-4">Tap play to witness the lore unfold.</p>
              </motion.div>

              {/* Frame 3: Wallet Glow */}
              <motion.div
                className="lore-snap-item flex-shrink-0 w-80 md:w-96 p-4 rounded-lg bg-graphite/80 border border-electric-purple/50 shadow-md flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <h3 className="text-2xl font-display text-electric-purple mb-4">Wallet Glow</h3>
                <img
                  src="/assets/a5.png"
                  alt="Raccoon atop a locked wallet, holding a flaming candlestick torch and 'REKT' scroll."
                  className="w-48 h-auto mb-4 filter drop-shadow-[0_0_15px_#7A3BFF]"
                  loading="lazy"
                />
                <p className="text-white/80">Laugh at the scars, light up the wallet.</p>
              </motion.div>

              {/* Frame 4: Ascension */}
              <motion.div
                className="lore-snap-item flex-shrink-0 w-80 md:w-96 p-4 rounded-lg bg-graphite/80 border border-coin-gold/50 shadow-md flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.5 }}
              >
                <h3 className="text-2xl font-display text-coin-gold mb-4">Ascension</h3>
                <img
                  src="/assets/a4.png"
                  alt="Raccoon riding a rocket holding a candlestick wand, throne glowing nearby."
                  className="w-48 h-auto mb-4 filter drop-shadow-[0_0_15px_#FFC300]"
                  loading="lazy"
                />
                <p className="text-white/80">Teach one degen, claim the throne.</p>
              </motion.div>
            </div>
          </div>
          <div className="container mx-auto mt-12 flex justify-center">
            <div className="p-8 rounded-lg bg-graphite/80 border-2 border-neon-turquoise shadow-lg shadow-neon-turquoise/30 text-center max-w-2xl">
              <p className="text-2xl md:text-3xl font-display text-neon-turquoise drop-shadow-[0_0_5px_#00F5FF]">
                “Admit the rekt. Share the lesson. Lift another degen. Claim the throne.”
              </p>
            </div>
          </div>
        </section>

        {/* LIVE SCROLLS Section */}
        <section id="scrolls" className="container mx-auto py-20 px-4 md:py-32 font-body relative">
          <h2 className="text-4xl md:text-5xl font-display text-neon-turquoise text-center mb-12">Live Scrolls</h2>
          <div className="bg-graphite/70 rounded-full px-6 py-2 text-lg text-acid-green border border-acid-green/50 text-center mb-10 mx-auto max-w-fit shadow-[0_0_15px_rgba(102,255,102,0.3)]">
            Reckon Drop every Friday 00:00 UTC.
          </div>

          <div className="flex flex-col gap-12">
            <div className="w-full grid grid-cols-1 gap-8 max-w-2xl mx-auto">
              {scrolls.map((scroll) => (
                <div
                  key={scroll.id}
                  className="bg-graphite/70 p-6 rounded-lg border border-electric-purple/30 shadow-lg relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-electric-purple/10 to-transparent transition-opacity opacity-0 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-display text-monk-orange mb-3">{scroll.title}</h3>
                    <p className="text-white/80 text-base mb-4 line-clamp-3">{scroll.confession}</p>
                    <div className="flex justify-between items-center text-neon-turquoise text-lg font-bold">
                      <span>Upvotes: {scroll.upvotes}</span>
                      <ButtonGlow
                        variant="ghost"
                        size="sm"
                        className="text-white hover:text-neon-turquoise group-hover:bg-electric-purple/20"
                        onClick={() => handleScrollUpvote(scroll.id)}
                        aria-label={`Upvote scroll by ${scroll.title}`}
                      >
                        <ArrowUpCircleIcon className="w-5 h-5 mr-1" /> Upvote
                      </ButtonGlow>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full flex flex-col items-center justify-center gap-12 mt-12 max-w-2xl mx-auto">
              <div className="relative w-full max-w-xs md:max-w-sm lg:max-w-md aspect-[3/4] flex items-center justify-center p-4 bg-graphite/70 rounded-lg border border-neon-turquoise/30 shadow-lg">
                <img
                  src="/assets/a1.png"
                  alt="Raccoon in orange robe on a floating crypto wallet with neon 'rekt' bubbles."
                  className="w-full h-full object-contain filter drop-shadow-[0_0_20px_#00F5FF]"
                  loading="lazy"
                />
              </div>
              <div className="w-full max-w-lg bg-graphite/70 p-8 rounded-lg border border-electric-purple shadow-lg">
                <h2 className="text-4xl md:text-5xl font-display text-neon-turquoise mb-8 text-center">
                  Mint a Scroll
                </h2>
                <form onSubmit={handleMintScrollSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="scroll-confession" className="text-sm font-medium text-white">
                      Your Confession (280 chars)
                    </label>
                    <Textarea
                      id="scroll-confession"
                      name="confession"
                      placeholder="I bought the top because I thought it was different this time..."
                      maxLength={280}
                      className="bg-graphite/50 border-electric-purple/50 text-white focus:ring-neon-turquoise focus:border-neon-turquoise"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="scroll-nickname" className="text-sm font-medium text-white">
                      Nickname
                    </label>
                    <Input
                      id="scroll-nickname"
                      name="nickname"
                      placeholder="DegenChad69"
                      className="bg-graphite/50 border-electric-purple/50 text-white focus:ring-neon-turquoise focus:border-neon-turquoise"
                    />
                  </div>
                  <ButtonGlow type="submit" variant="neon" className="mt-4">
                    Submit Scroll
                  </ButtonGlow>
                </form>
                <p className="text-xs text-center text-white/60 mt-2">
                  Wallet connect arrives at launch. For now, share your Scroll and claim early clout.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* LEADERBOARD PREVIEW Section */}
        <section
          id="leaderboard"
          className="container mx-auto py-20 px-4 md:py-32 text-center font-body relative overflow-hidden"
        >
          <div
            className="absolute inset-0 z-0 opacity-10 filter blur-3xl"
            style={{
              backgroundImage: "url(/assets/a6.png)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          ></div>
          <h2 className="text-4xl md:text-5xl font-display text-acid-green mb-12 relative z-10">Chair of RECKoning</h2>
          <div className="relative z-10 max-w-4xl mx-auto bg-graphite/70 p-8 rounded-xl border border-electric-purple/40 shadow-lg">
            <Tabs defaultValue="mentors" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-graphite border border-electric-purple/30 mb-8">
                <TabsTrigger
                  value="mentors"
                  className="data-[state=active]:bg-electric-purple data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-electric-purple/30"
                  onClick={() => dispatchAnalyticsEvent("leaderboard_tab_change", { tab: "Mentors" })}
                >
                  Mentors
                </TabsTrigger>
                <TabsTrigger
                  value="bards"
                  className="data-[state=active]:bg-electric-purple data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-electric-purple/30"
                  onClick={() => dispatchAnalyticsEvent("leaderboard_tab_change", { tab: "Bards" })}
                >
                  Bards
                </TabsTrigger>
                <TabsTrigger
                  value="builders"
                  className="data-[state=active]:bg-electric-purple data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-electric-purple/30"
                  onClick={() => dispatchAnalyticsEvent("leaderboard_tab_change", { tab: "Builders" })}
                >
                  Builders
                </TabsTrigger>
              </TabsList>
              <TabsContent value="mentors" className="mt-0">
                <div className="flex justify-center items-center gap-8 mb-8 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`mentor-${i}`} className="relative flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-monk-orange/20 border-2 border-monk-orange flex items-center justify-center text-3xl font-bold text-monk-orange relative z-10 overflow-hidden">
                        <img
                          src={`/assets/a${(i % 7) + 1}.png`} // Cycle through a1.png to a7.png
                          alt={
                            (i % 7) + 1 === 1
                              ? "Raccoon in orange robe on a floating crypto wallet with neon 'rekt' bubbles."
                              : (i % 7) + 1 === 2
                                ? "Raccoon monk walking with a candlestick staff and glowing 'rekt' panels."
                                : (i % 7) + 1 === 3
                                  ? "Meditating raccoon with red and green laser tears and halo."
                                  : (i % 7) + 1 === 4
                                    ? "Raccoon riding a rocket holding a candlestick wand, throne glowing nearby."
                                    : (i % 7) + 1 === 5
                                      ? "Raccoon atop a locked wallet, holding a flaming candlestick torch and 'REKT' scroll."
                                      : (i % 7) + 1 === 6
                                        ? "Raccoon tumbling through space with orbiting meme coins and a neon throne."
                                        : "Raccoon meditating cross‑legged, holding a scroll beside a purple wallet."
                          }
                          className="w-full h-full object-cover rounded-full"
                        />
                        <img
                          src="/assets/a4.png"
                          alt="Throne badge"
                          className="absolute -bottom-4 -right-4 w-12 h-12 rotate-12 opacity-80 filter drop-shadow-[0_0_5px_#FFC300]"
                        />
                      </div>
                      <span className="mt-2 text-sm text-white/80">Mentor #{i + 1}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="bards" className="mt-0">
                <div className="flex justify-center items-center gap-8 mb-8 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`bard-${i}`} className="relative flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-electric-purple/20 border-2 border-electric-purple flex items-center justify-center text-3xl font-bold text-electric-purple relative z-10 overflow-hidden">
                        <img
                          src={`/assets/a${((i + 2) % 7) + 1}.png`} // Offset to use different images
                          alt={
                            ((i + 2) % 7) + 1 === 1
                              ? "Raccoon in orange robe on a floating crypto wallet with neon 'rekt' bubbles."
                              : ((i + 2) % 7) + 1 === 2
                                ? "Raccoon monk walking with a candlestick staff and glowing 'rekt' panels."
                                : ((i + 2) % 7) + 1 === 3
                                  ? "Meditating raccoon with red and green laser tears and halo."
                                  : ((i + 2) % 7) + 1 === 4
                                    ? "Raccoon riding a rocket holding a candlestick wand, throne glowing nearby."
                                    : ((i + 2) % 7) + 1 === 5
                                      ? "Raccoon atop a locked wallet, holding a flaming candlestick torch and 'REKT' scroll."
                                      : ((i + 2) % 7) + 1 === 6
                                        ? "Raccoon tumbling through space with orbiting meme coins and a neon throne."
                                        : "Raccoon meditating cross‑legged, holding a scroll beside a purple wallet."
                          }
                          className="w-full h-full object-cover rounded-full"
                        />
                        <img
                          src="/assets/a4.png"
                          alt="Throne badge"
                          className="absolute -bottom-4 -right-4 w-12 h-12 rotate-12 opacity-80 filter drop-shadow-[0_0_5px_#FFC300]"
                        />
                      </div>
                      <span className="mt-2 text-sm text-white/80">Bard #{i + 1}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="builders" className="mt-0">
                <div className="flex justify-center items-center gap-8 mb-8 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={`builder-${i}`} className="relative flex flex-col items-center">
                      <div className="w-20 h-20 rounded-full bg-neon-turquoise/20 border-2 border-neon-turquoise flex items-center justify-center text-3xl font-bold text-neon-turquoise relative z-10 overflow-hidden">
                        <img
                          src={`/assets/a${((i + 4) % 7) + 1}.png`} // Offset to use different images
                          alt={
                            ((i + 4) % 7) + 1 === 1
                              ? "Raccoon in orange robe on a floating crypto wallet with neon 'rekt' bubbles."
                              : ((i + 4) % 7) + 1 === 2
                                ? "Raccoon monk walking with a candlestick staff and glowing 'rekt' panels."
                                : ((i + 4) % 7) + 1 === 3
                                  ? "Meditating raccoon with red and green laser tears and halo."
                                  : ((i + 4) % 7) + 1 === 4
                                    ? "Raccoon riding a rocket holding a candlestick wand, throne glowing nearby."
                                    : ((i + 4) % 7) + 1 === 5
                                      ? "Raccoon atop a locked wallet, holding a flaming candlestick torch and 'REKT' scroll."
                                      : ((i + 4) % 7) + 1 === 6
                                        ? "Raccoon tumbling through space with orbiting meme coins and a neon throne."
                                        : "Raccoon meditating cross‑legged, holding a scroll beside a purple wallet."
                          }
                          className="w-full h-full object-cover rounded-full"
                        />
                        <img
                          src="/assets/a4.png"
                          alt="Throne badge"
                          className="absolute -bottom-4 -right-4 w-12 h-12 rotate-12 opacity-80 filter drop-shadow-[0_0_5px_#FFC300]"
                        />
                      </div>
                      <span className="mt-2 text-sm text-white/80">Builder #{i + 1}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            <p className="mt-8 text-lg text-white/80 max-w-2xl mx-auto">
              Status here isn’t about entries—it’s about generosity. Upvote wisdom. Celebrate comedy. Reward the next
              monk in line.
            </p>
          </div>
        </section>

        {/* TOKEN SNAPSHOT & ROADMAP Section */}
        <section
          id="token"
          className="container mx-auto py-20 px-4 md:py-32 font-body flex flex-col lg:flex-row items-center justify-between gap-12"
        >
          <div className="lg:w-1/2 bg-graphite/70 p-8 rounded-xl border border-coin-gold/50 shadow-lg text-center">
            <h2 className="text-4xl md:text-5xl font-display text-coin-gold mb-8">Token Snapshot</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-lg md:text-xl mb-8">
              <div className="flex flex-col items-center">
                <span className="font-bold text-neon-turquoise">Chain:</span>
                <span className="text-white/90">TBD</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-electric-purple">Ticker:</span>
                <span className="text-white/90">$RECK</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-monk-orange">Contract:</span>
                <span className="text-white/90">0x… (placeholder)</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-acid-green">Supply:</span>
                <span className="text-white/90">TBD</span>
              </div>
            </div>
            <p className="text-lg md:text-xl text-white/80 mb-8">
              Launch vibe: fair‑memes, no promises. Transparency: Wallets/LP links post‑launch.
            </p>
            <p className="text-signal-red font-bold text-xl md:text-2xl mt-8">
              This is entertainment and community art. Not financial advice.
            </p>
          </div>

          <div className="lg:w-1/2 relative min-h-[300px] md:min-h-[500px] flex justify-center items-center">
            <img
              src="/assets/a7.png"
              alt="Raccoon meditating cross‑legged, holding a scroll beside a purple wallet."
              className="w-full h-auto object-contain filter drop-shadow-[0_0_20px_#7A3BFF]"
              loading="lazy"
            />
          </div>
        </section>

        {/* ROADMAP / FAQ Section */}
        <section id="faq" className="container mx-auto py-20 px-4 md:py-32 font-body">
          <div className="flex flex-col gap-12">
            <div className="w-full">
              {" "}
              {/* Occupy col-md-12 */}
              <h2 className="text-4xl md:text-5xl font-display text-electric-purple mb-8 text-center">
                Roadmap — Story Acts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Act I */}
                <div className="bg-graphite/70 p-6 rounded-lg border border-electric-purple/30 shadow-lg flex flex-col">
                  <h3 className="text-2xl font-display text-neon-turquoise mb-4">Act I — Admission</h3>
                  <p className="text-white/80 mb-4 flex-grow">
                    Launch, Friday Reckon Drops, meme contests with wallet/rocket/throne art.
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
                    <div className="bg-electric-purple h-2.5 rounded-full" style={{ width: "30%" }}></div>
                  </div>
                  <p className="text-lg font-bold text-acid-green text-center mt-2">Starting Very Soon</p>
                </div>
                {/* Act II */}
                <div className="bg-graphite/70 p-6 rounded-lg border border-electric-purple/30 shadow-lg flex flex-col">
                  <h3 className="text-2xl font-display text-neon-turquoise mb-4">Act II — Communion</h3>
                  <p className="text-white/80 mb-4 flex-grow">
                    Spaces with “Reckon Readings”, emoji‑coin sticker pack, short origin animation.
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
                    <div className="bg-electric-purple h-2.5 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <p className="text-lg font-bold text-white/50 text-center mt-2">Upcoming</p>
                </div>
                {/* Act III */}
                <div className="bg-graphite/70 p-6 rounded-lg border border-electric-purple/30 shadow-lg flex flex-col">
                  <h3 className="text-2xl font-display text-neon-turquoise mb-4">Act III — Ascension</h3>
                  <p className="text-white/80 mb-4 flex-grow">
                    Master Scrolls for top mentors, seasonal palette arcs, cross‑meme collabs.
                  </p>
                  <div className="w-full bg-white/10 rounded-full h-2.5 mb-2">
                    <div className="bg-electric-purple h-2.5 rounded-full" style={{ width: "0%" }}></div>
                  </div>
                  <p className="text-lg font-bold text-white/50 text-center mt-2">Upcoming</p>
                </div>
              </div>
            </div>
            <div className="w-full bg-graphite/70 p-8 rounded-xl border border-acid-green/40 shadow-lg">
              {" "}
              {/* Occupy col-md-12 and add box styling */}
              <h2 className="text-4xl md:text-5xl font-display text-acid-green mb-8 text-center">FAQ</h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1" className="border-acid-green/30">
                  <AccordionTrigger className="text-monk-orange hover:text-white text-xl font-display group">
                    What is a Rekt Scroll?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    A public confession minted as a collectible (SBT/NFT later).
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="border-acid-green/30">
                  <AccordionTrigger className="text-monk-orange hover:text-white text-xl font-display group">
                    How do I earn $RECK?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    Community upvotes flow into weekly Reckon Drops for top scrolls.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-3" className="border-acid-green/30">
                  <AccordionTrigger className="text-monk-orange hover:text-white text-xl font-display group">
                    Do I need a wallet now?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">
                    Not for v1 feed; wallet required once minting goes live.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-4" className="border-acid-green/30">
                  <AccordionTrigger className="text-monk-orange hover:text-white text-xl font-display group">
                    Is this financial advice?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/80">No—this is entertainment and culture.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER / LEGAL Section */}
      <footer
        id="legal"
        className="bg-graphite/90 py-16 px-4 text-center border-t border-electric-purple/20 font-body text-white/70 text-sm"
      >
        <div className="container mx-auto">
          <p className="mb-4">Contract Placeholder: 0x… (TBD)</p>
          <div className="flex justify-center space-x-6 mb-8">
            <a
              href="https://twitter.com/reck_community"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-turquoise hover:text-white transition-colors"
              onClick={() => dispatchAnalyticsEvent("social_click", { platform: "X" })}
              aria-label="Join us on X"
            >
              <XIcon className="h-6 w-6" />
            </a>
            <a
              href="https://discord.gg/reck"
              target="_blank"
              rel="noopener noreferrer"
              className="text-electric-purple hover:text-white transition-colors"
              onClick={() => dispatchAnalyticsEvent("social_click", { platform: "Discord" })}
              aria-label="Join us on Discord"
            >
              <DiscordIcon className="h-6 w-6" />
            </a>
            <a
              href="https://t.me/reck_community"
              target="_blank"
              rel="noopener noreferrer"
              className="text-monk-orange hover:text-white transition-colors"
              onClick={() => dispatchAnalyticsEvent("social_click", { platform: "Telegram" })}
              aria-label="Join us on Telegram"
            >
              <TelegramIcon className="h-6 w-6" />
            </a>
          </div>
          <div className="max-w-3xl mx-auto space-y-4 mb-8">
            <p className="text-white/80 font-bold">Community Guidelines:</p>
            <p>Be helpful, be funny, no spam/hate.</p>

            <p className="text-white/80 font-bold">Risk Statement:</p>
            <p>
              Crypto is volatile; DYOR; no promises. This is for entertainment purposes only and not financial advice.
            </p>

            <p className="text-white/80 font-bold">Art Usage:</p>
            <p>Keep robe orange, halos subtle; no misrepresentation of the $RECK brand or its values.</p>
          </div>
          <p className="text-lg text-neon-turquoise font-bold">Made with memes, humility, and $RECK.</p>
        </div>
      </footer>
    </div>
  )
}

function ArrowUpCircleIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 8V16" />
      <path d="M16 12L12 8L8 12" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M18 6L6 18" />
      <path d="M6 6L18 18" />
    </svg>
  )
}

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M10.74 13.91c.84.4 1.76.4 2.6 0M8 17.5c.91.46 1.98.67 3.06.67s2.15-.21 3.06-.67" />
      <path d="M20 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM8.06 9.07c-.45-.45-.45-1.18 0-1.63s1.18-.45 1.63 0c.45.45.45 1.18 0 1.63s-1.18.45-1.63 0zM15.94 9.07c-.45-.45-.45-1.18 0-1.63s1.18-.45 1.63 0c.45.45.45 1.18 0 1.63s-1.18.45-1.63 0z" />
      <path d="M12 2a10 10 0 0 0-8 9.8c.24 2.8 2.05 5.25 4.54 6.84A10 10 0 0 0 12 22a10 10 0 0 0 7.46-4.56c2.49-1.59 4.3-4.04 4.54-6.84A10 10 0 0 0 12 2z" />
    </svg>
  )
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 12A10 10 0 0 1 12 2c-5.523 0-10 4.477-10 10a10 10 0 0 1 10 10c2.8 0 5.3-.9 7.4-2.5L22 22l-2.5-7.4A9.9 9.9 0 0 0 22 12z" />
      <path d="M8.5 12.5L12 9l3.5 3.5-2 2-1.5-1.5z" />
    </svg>
  )
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M12 5L12 19" />
      <path d="M5 12L19 12" />
    </svg>
  )
}

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 12L19 12" />
    </svg>
  )
}
