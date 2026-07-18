import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Balloons } from "@/components/ui/balloons";
import { useAdmin } from "@/contexts/AdminContext";
import confetti from "canvas-confetti";

export default function BirthdayCakeApp({ onFinale }: { onFinale: () => void }) {
  const { content } = useAdmin();
  const [candlesBlown, setCandlesBlown] = useState(false);
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null);

  const blowCandles = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    if (navigator.vibrate) navigator.vibrate(300);

    setTimeout(() => {
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#FFB6D9", "#E8F4FF"] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FFB6D9", "#E8F4FF"] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      setTimeout(() => balloonsRef.current?.launchAnimation(), 500);
      setTimeout(() => onFinale(), 5500);
    }, 1000);
  };

  const BASE = import.meta.env.BASE_URL;

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] relative flex flex-col items-center justify-center overflow-hidden pb-16">
      <Balloons ref={balloonsRef as any} type="default" />

      {/* Party hat — top left floating */}
      <motion.img src={`${BASE}deco/party-hat.png`} alt="" className="absolute top-2 left-4 w-16 object-contain select-none pointer-events-none z-20"
        animate={{ rotate: [-8, 4, -8], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
      {/* Seonghyeon cooking mama — top right */}
      <motion.img src={`${BASE}chars/chef-seon.jpg`} alt="seonghyeon" className="absolute top-2 right-2 w-20 object-contain select-none pointer-events-none z-20 rounded-xl shadow-md"
        animate={{ rotate: [3, -2, 3] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} />

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-lg px-6 glass-white py-10 rounded-3xl border border-[#FFB6D9]/50 shadow-2xl">
        {/* "16" candle illustration */}
        <motion.img src={`${BASE}deco/candle-16.png`} alt="16" className="w-40 object-contain select-none"
          animate={{ scale: [1, 1.03, 1] }} transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} />

        <motion.div
          className="relative w-64 h-64 mx-auto"
          animate={candlesBlown ? { y: 20 } : {}}
          transition={{ type: "spring" }}
        >
          <img
            src={`${import.meta.env.BASE_URL}images/cake.png`}
            alt="Kue Ulang Tahun"
            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(255,182,217,0.4)] rounded-3xl"
          />
          {!candlesBlown && (
            <div className="absolute inset-0 flex justify-center pb-[40%] gap-3 pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2.5 h-7 bg-yellow-300 rounded-[50%_50%_20%_20%] shadow-[0_0_20px_#fbbf24] blur-[1px]"
                  style={{ marginTop: i === 2 ? "-1rem" : i === 1 || i === 3 ? "-0.5rem" : "0" }}
                  animate={{ scale: [1, 1.1, 0.9, 1], x: [(Math.random() - 0.5) * 4, 0] }}
                  transition={{ repeat: Infinity, duration: 0.12 + Math.random() * 0.08 }}
                />
              ))}
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!candlesBlown ? (
            <motion.button
              key="tiup"
              onClick={blowCandles}
              className="glass-pink px-10 py-4 rounded-full text-lg font-semibold text-foreground shadow-[0_0_30px_rgba(255,182,217,0.4)] hover:bg-[#FFB6D9] hover:text-white hover:scale-105 transition-all border-[#FFB6D9] cursor-pointer"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
            >
              Tiup Lilin 🌬️
            </motion.button>
          ) : (
            <motion.div
              key="selesai"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <h2
                className="text-4xl font-bold"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  background: "linear-gradient(135deg, #D45A8F, #FF8CBA)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {content.cakeBlownMessage}
              </h2>
              <p className="text-foreground/60 mt-3 text-sm font-mono">{content.cakeWishMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pink birthday cake + denim board */}
        <div className="flex items-end gap-3 justify-center pt-2">
          <motion.img src={`${BASE}deco/cake-pink.png`} alt="" className="w-20 object-contain select-none"
            animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
          <motion.img src={`${BASE}deco/denim-board.png`} alt="" className="w-24 object-contain select-none"
            animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} />
        </div>
      </div>
    </div>
  );
}
