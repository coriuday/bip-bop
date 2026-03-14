"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const features = [
  {
    emoji: "🎬",
    title: "Short-Form Videos",
    description: "Create and watch bite-sized videos that capture real moments — up to 60 seconds of pure creativity.",
  },
  {
    emoji: "❤️",
    title: "Real Connections",
    description: "Follow creators you love, react with likes and comments, and build a community around your content.",
  },
  {
    emoji: "⚡",
    title: "Creator Studio",
    description: "Powerful analytics, video management, and audience insights in one beautiful dashboard.",
  },
];

const stats = [
  { value: "10K+", label: "Creators" },
  { value: "1M+", label: "Videos" },
  { value: "500K+", label: "Daily Views" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" as const },
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white selection:bg-[#FF2D55]/30">
      {/* ─── Animated background orbs ──────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] h-[60vw] w-[60vw] rounded-full bg-[#FF2D55] opacity-[0.07] blur-[120px] animate-orb-1" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[55vw] w-[55vw] rounded-full bg-[#7B2FFF] opacity-[0.07] blur-[100px] animate-orb-2" />
        <div className="absolute top-[40%] left-[50%] h-[35vw] w-[35vw] -translate-x-1/2 rounded-full bg-[#00D4FF] opacity-[0.05] blur-[80px] animate-orb-3" />
      </div>

      {/* ─── Nav spacer (navbar is fixed at top) ─────────────────── */}
      <div className="h-16" />

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-24">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="mb-6 inline-flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/70 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-[#FF2D55] animate-pulse-glow" />
            Now in Early Access
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.1)}
          className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
        >
          Create.{" "}
          <span className="gradient-text">Connect.</span>
          <br />
          Go Viral.
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          {...fadeUp(0.2)}
          className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl"
        >
          BipBop is the short-form video platform built for real creators.
          Upload your moment, find your audience, and make it unforgettable.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          {...fadeUp(0.3)}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link href="/auth/signup">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF2D55] via-[#7B2FFF] to-[#00D4FF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#FF2D55]/25 transition-shadow hover:shadow-[#FF2D55]/50"
            >
              <span>Get Started — It&apos;s Free</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </Link>

          <Link href="/auth/signin">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-base font-medium text-white/80 backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/25 hover:text-white"
            >
              Sign In
            </motion.button>
          </Link>
        </motion.div>

        {/* Social proof stats */}
        <motion.div
          {...fadeUp(0.4)}
          className="mx-auto mt-16 grid max-w-sm grid-cols-3 gap-4 sm:max-w-md"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-extrabold sm:text-3xl gradient-text">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-white/50 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Feature Cards ───────────────────────────────────────── */}
      <section
        aria-labelledby="features-heading"
        className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-4"
      >
        <motion.h2
          id="features-heading"
          {...fadeUp(0.45)}
          className="mb-10 text-center text-3xl font-bold sm:text-4xl"
        >
          Everything you need to{" "}
          <span className="gradient-text">shine</span>
        </motion.h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              {...fadeUp(0.5 + i * 0.1)}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF2D55]/20 to-[#7B2FFF]/20 text-2xl transition-transform duration-300 group-hover:scale-110">
                {f.emoji}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Bottom CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 pb-24 text-center">
        <motion.div
          {...fadeUp(0.6)}
          className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-12 backdrop-blur-sm"
        >
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-[#FF2D55]">
            Ready to start?
          </p>
          <h2 className="mb-4 text-3xl font-extrabold sm:text-4xl">
            Your audience is waiting
          </h2>
          <p className="mb-8 text-white/55">
            Join thousands of creators who found their voice on BipBop. No experience needed — just your story.
          </p>
          <Link href="/auth/signup">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF2D55] to-[#7B2FFF] px-8 py-4 text-base font-semibold text-white shadow-xl shadow-[#FF2D55]/25 transition-shadow hover:shadow-[#FF2D55]/50"
            >
              🚀 Create Your Account
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}