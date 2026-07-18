import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  msgIdx: number | null; // null = decorative only
}

export default function SkyApp() {
  const { content } = useAdmin();
  const BASE = import.meta.env.BASE_URL;
  const msgs = content.skyMessages;

  const [stars, setStars] = useState<Star[]>([]);
  const [activeMsg, setActiveMsg] = useState<{ text: string; x: number; y: number; id: number } | null>(null);
  const [openedIdx, setOpenedIdx] = useState<Set<number>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build star field whenever message count changes
  useEffect(() => {
    const rng = (min: number, max: number) => Math.random() * (max - min) + min;

    // One clickable star per message, placed in a grid-ish spread
    const clickable: Star[] = msgs.map((_, i) => ({
      id: i,
      x: rng(5, 90),
      y: rng(8, 82),
      size: rng(28, 48),
      delay: rng(0, 3),
      duration: rng(2.5, 4.5),
      msgIdx: i,
    }));

    // Extra decorative mini stars (non-clickable)
    const deco: Star[] = Array.from({ length: 60 }, (_, i) => ({
      id: 1000 + i,
      x: rng(0, 100),
      y: rng(0, 100),
      size: rng(8, 18),
      delay: rng(0, 5),
      duration: rng(2, 5),
      msgIdx: null,
    }));

    setStars([...deco, ...clickable]);
  }, [msgs.length]);

  const handleClickStar = (star: Star, e: React.MouseEvent) => {
    if (star.msgIdx === null) return;
    e.stopPropagation();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const container = (e.currentTarget as HTMLElement).closest("[data-sky]") as HTMLElement;
    const cx = container ? (rect.left - container.getBoundingClientRect().left + rect.width / 2) / container.offsetWidth * 100 : star.x;
    const cy = container ? (rect.top - container.getBoundingClientRect().top) / container.offsetHeight * 100 : star.y;

    if (navigator.vibrate) navigator.vibrate(50);
    setOpenedIdx(prev => new Set([...prev, star.msgIdx!]));
    setActiveMsg({ text: msgs[star.msgIdx!], x: cx, y: cy, id: Date.now() });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setActiveMsg(null), 3000);
  };

  return (
    <div
      data-sky
      className="w-full min-h-[calc(100vh-6rem)] rounded-3xl overflow-hidden relative shadow-2xl pb-16 select-none"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #070010 40%, #020205 100%)" }}
    >
      {/* Subtle purple glow at top */}
      <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#4a1a7a]/25 to-transparent pointer-events-none" />
      {/* Pink glow at bottom */}
      <div className="absolute bottom-0 inset-x-0 h-[30vh] bg-gradient-to-t from-[#FFB6D9]/10 to-transparent pointer-events-none" />

      {/* Pink moon */}
      <motion.img
        src={`${BASE}deco/moon-pink.png`} alt=""
        className="absolute top-5 right-5 w-20 h-20 object-contain pointer-events-none"
        style={{ filter: "drop-shadow(0 0 18px rgba(255,182,217,0.55))" }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.65, 0.85, 0.65] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      />

      {/* Shooting star */}
      <motion.div
        className="absolute w-24 h-px bg-gradient-to-r from-transparent via-[#FFB6D9] to-transparent rotate-[35deg] pointer-events-none"
        animate={{ x: ["-120vw", "120vw"], y: ["-20vh", "120vh"] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 11, ease: "linear" }}
      />

      {/* Hint text */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white/35 font-serif italic text-xs pointer-events-none whitespace-nowrap z-10">
        ✦ Ketuk bintang untuk pesan ✦
      </div>

      {/* Star field */}
      <div className="absolute inset-0">
        {stars.map(star => {
          const isClickable = star.msgIdx !== null;
          const isOpened = isClickable && openedIdx.has(star.msgIdx!);
          return (
            <motion.img
              key={star.id}
              src={`${BASE}deco/star-pink.png`}
              alt=""
              className={`absolute object-contain ${isClickable ? "cursor-pointer z-10" : "pointer-events-none z-0"}`}
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                filter: isOpened
                  ? "drop-shadow(0 0 10px rgba(255,182,217,0.9)) brightness(1.3)"
                  : isClickable
                  ? "drop-shadow(0 0 6px rgba(255,182,217,0.5))"
                  : "brightness(0.85)",
              }}
              animate={{
                opacity: isClickable
                  ? [0.7, 1, 0.7]
                  : [0.25, 0.7, 0.25],
                scale: isOpened ? [1, 1.25, 1] : [1, 1.08, 1],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
              onClick={isClickable ? (e) => handleClickStar(star, e) : undefined}
              whileHover={isClickable ? { scale: 1.3, filter: "drop-shadow(0 0 12px rgba(255,182,217,0.9)) brightness(1.2)" } : undefined}
              whileTap={isClickable ? { scale: 0.9 } : undefined}
            />
          );
        })}
      </div>

      {/* Message popup */}
      <AnimatePresence>
        {activeMsg && (
          <motion.div
            key={activeMsg.id}
            className="absolute z-30 pointer-events-none"
            style={{
              left: `clamp(16px, calc(${activeMsg.x}% - 90px), calc(100% - 200px))`,
              top: `calc(${activeMsg.y}% - 64px)`,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
          >
            <div
              className="px-4 py-2.5 rounded-2xl text-white text-sm font-medium leading-snug shadow-2xl"
              style={{
                background: "rgba(20,8,40,0.85)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,182,217,0.35)",
                boxShadow: "0 0 24px rgba(255,182,217,0.3), 0 4px 20px rgba(0,0,0,0.5)",
                maxWidth: 200,
              }}
            >
              <span className="text-[#FFB6D9] mr-1.5">✦</span>{activeMsg.text}
            </div>
            {/* Tail */}
            <div className="w-2 h-2 bg-[rgba(20,8,40,0.85)] rotate-45 mx-auto -mt-1" style={{ border: "1px solid rgba(255,182,217,0.35)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
