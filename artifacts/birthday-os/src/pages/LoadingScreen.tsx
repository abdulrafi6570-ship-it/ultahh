import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";

/** Pixel-heart SVG matching the reference sticker */
function PixelHeart({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 14" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="4" height="2" fill="#F48BAA"/>
      <rect x="10" y="0" width="4" height="2" fill="#F48BAA"/>
      <rect x="0" y="2" width="6" height="2" fill="#F48BAA"/>
      <rect x="10" y="2" width="6" height="2" fill="#F48BAA"/>
      <rect x="0" y="4" width="16" height="2" fill="#F48BAA"/>
      <rect x="0" y="6" width="16" height="2" fill="#FFB6D0"/>
      <rect x="2" y="8" width="12" height="2" fill="#FFB6D0"/>
      <rect x="4" y="10" width="8" height="2" fill="#F48BAA"/>
      <rect x="6" y="12" width="4" height="2" fill="#F48BAA"/>
    </svg>
  );
}

function CandyProgressBar({ progress }: { progress: number }) {
  const pct = Math.floor(progress);
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* LOADING label */}
      <p className="text-[11px] font-medium tracking-[0.22em] uppercase select-none" style={{ color: "#C07090", fontFamily: "sans-serif" }}>
        LOADING......
      </p>

      {/* Bar row */}
      <div className="flex items-center gap-3 w-full max-w-[230px]">
        {/* Left hearts */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <PixelHeart size={12} />
          <PixelHeart size={9} className="ml-1 opacity-60" />
        </div>

        {/* Track */}
        <div className="relative flex-1 h-7 rounded-full overflow-hidden"
          style={{
            background: "#D8F0D8",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
            border: "2.5px dotted #D8A0B8",
            outline: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          {/* Filled stripe area */}
          {progress > 0 && (
            <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
              style={{ width: `${progress}%`, transition: "width 0.12s linear" }}>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cs2" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                    <rect width="9" height="16" fill="#FFB6D0"/>
                    <rect x="9" width="7" height="16" fill="#F48BAA"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cs2)"/>
              </svg>
              {/* gloss */}
              <div className="absolute inset-0 rounded-full"
                style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 55%)" }}/>
            </div>
          )}

          {/* Centered percentage text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-black select-none"
              style={{
                fontFamily: "sans-serif",
                color: "#fff",
                textShadow: "0 0 0 #D45A8F, 1px 0 0 #D45A8F, -1px 0 0 #D45A8F, 0 1px 0 #D45A8F, 0 -1px 0 #D45A8F",
                WebkitTextStroke: "1.5px #D45A8F",
                letterSpacing: "0.04em",
              }}
            >{pct}%</span>
          </div>
        </div>

        {/* Right hearts */}
        <div className="flex flex-col gap-0.5 flex-shrink-0 items-end">
          <PixelHeart size={12} />
          <PixelHeart size={9} className="mr-1 opacity-60" />
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const { content } = useAdmin();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3500;
    const interval = 40;
    const steps = duration / interval;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const t = currentStep / steps;
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.min(eased * 100, 100));
      if (currentStep >= steps) { clearInterval(timer); setTimeout(onComplete, 600); }
    }, interval);
    return () => clearInterval(timer);
  }, [onComplete]);

  const BASE = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FFF0F8 0%, #FFD6E8 40%, #E8F4FF 100%)" }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Orbs */}
      <motion.div className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,182,217,0.45) 0%, transparent 70%)", top: "-15%", left: "-10%" }}
        animate={{ x: [0,30,0], y: [0,-20,0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} />
      <motion.div className="absolute w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(232,244,255,0.6) 0%, transparent 70%)", bottom: "-10%", right: "-5%" }}
        animate={{ x: [0,-25,0], y: [0,20,0] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }} />

      {/* Floating sticker: pixel hearts top-right */}
      <motion.img src={`${BASE}stickers/hearts.png`} alt=""
        className="absolute top-12 right-6 w-20 opacity-70 pointer-events-none select-none"
        style={{ filter: "drop-shadow(0 2px 8px rgba(255,182,217,0.4))" }}
        animate={{ y: [0,-8,0], rotate: [0,4,0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />

      {/* Floating sticker: LOVE bottom-left */}
      <motion.img src={`${BASE}stickers/love.png`} alt=""
        className="absolute bottom-20 left-4 w-24 opacity-60 pointer-events-none select-none"
        style={{ filter: "drop-shadow(0 2px 8px rgba(255,182,217,0.3))" }}
        animate={{ y: [0,6,0], rotate: [0,-3,0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} />

      {/* Main */}
      <motion.div className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
        <motion.div className="text-5xl select-none"
          animate={{ scale: [1,1.15,1], opacity: [0.8,1,0.8] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          🌸
        </motion.div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-6xl font-bold tracking-tight" style={{
            fontFamily: "'Playfair Display', serif", fontStyle: "italic",
            background: "linear-gradient(135deg, #D45A8F 0%, #FF8CBA 50%, #C03575 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: "drop-shadow(0 2px 12px rgba(212,90,143,0.25))",
          }}>
            {content.siteTitle.replace(" ♡","")}
          </h1>
          <p className="text-[#D45A8F]/70 text-sm tracking-[0.2em] uppercase font-light text-center px-6">
            {content.loadingSubtitle}
          </p>
        </div>

        <div className="w-64 mt-2">
          <CandyProgressBar progress={progress} />
        </div>
      </motion.div>

      {/* Bottom dots */}
      <motion.div className="absolute bottom-12 flex gap-2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#FFB6D9" }}
            animate={{ opacity: [0.3,1,0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }} />
        ))}
      </motion.div>
    </motion.div>
  );
}
