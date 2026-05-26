"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BoltIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/solid";

const SLIDES = [
  {
    id: 0,
    badge: "Smart Workflows",
    badgeIcon: BoltIcon,
    badgeColor: "text-orange-400",
    title: (
      <>
        Elevate your
        <br />
        <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Task Management
        </span>
        <br />
        <span className="text-blue-500">with ANSH</span>
      </>
    ),
    copy: "Focus on what actually matters. Let our system automatically track priorities, set reminders, and organize your day without the manual busywork.",
  },
  {
    id: 1,
    badge: "Team Collaboration",
    badgeIcon: ChatBubbleLeftRightIcon,
    badgeColor: "text-indigo-400",
    title: (
      <>
        Connect your
        <br />
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Entire Team
        </span>
        <br />
        <span className="text-indigo-500">instantly</span>
      </>
    ),
    copy: "Move faster with built-in rich chat, direct messages, and team channels. Keep conversations and tasks completely in sync.",
  },
  {
    id: 2,
    badge: "Visual Boards",
    badgeIcon: SquaresPlusIcon,
    badgeColor: "text-rose-400",
    title: (
      <>
        Track progress
        <br />
        <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
          Without friction
        </span>
        <br />
        <span className="text-rose-500">beautifully</span>
      </>
    ),
    copy: "Visualize your workload using lightning-fast Kanban boards. Drag, drop, and complete tasks effortlessly with real-time updates.",
  },
] as const;

export function AuthMarketingPanel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#0a0a0a] lg:flex lg:w-1/2">
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex h-full flex-col p-12 xl:p-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
              <slide.badgeIcon className={`h-4 w-4 ${slide.badgeColor}`} />
              <span className="text-xs font-semibold tracking-wide text-zinc-300">{slide.badge}</span>
            </div>

            <h1 className="mt-8 font-heading text-5xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-6xl">
              {slide.title}
            </h1>

            <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400">{slide.copy}</p>
          </motion.div>
        </AnimatePresence>

        <div className="relative mt-auto h-[300px] w-full">
          <AnimatePresence mode="wait">
            {currentSlide === 0 && (
              <motion.div
                key="slide0"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="absolute bottom-10 left-10 w-72 rounded-2xl border border-white/5 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-xl">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                    <BoltIcon className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="mt-4 text-center text-sm font-bold text-white">Workflow Active</h3>
                  <p className="mt-1 text-center text-xs text-zinc-500">Reminder sent to 12 participants</p>
                  <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full w-2/3 rounded-full bg-orange-500" />
                  </div>
                </div>
                <div className="absolute bottom-32 left-[360px] flex items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/90 px-4 py-3 shadow-xl backdrop-blur-md">
                  <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs font-bold text-zinc-200">Email Sent</span>
                </div>
              </motion.div>
            )}

            {currentSlide === 1 && (
              <motion.div
                key="slide1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="absolute bottom-16 left-16 w-80 rounded-2xl border border-white/5 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                      AR
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-white">
                        Alex Rivera <span className="text-[10px] font-normal text-zinc-500">9:45 AM</span>
                      </p>
                      <p className="text-xs text-zinc-300">
                        Design looks spot on. The new drawer interactions are buttery smooth. ✨
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentSlide === 2 && (
              <motion.div
                key="slide2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="absolute bottom-12 left-20 w-64 rounded-xl border border-white/5 bg-zinc-900/80 p-4 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-zinc-300">Done</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-white">Ship Task Dashboard</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">High</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[9px] font-bold text-white">
                      ME
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-10 left-12 flex gap-2">
          {SLIDES.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === index ? "w-8 bg-teal-500" : "w-4 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
