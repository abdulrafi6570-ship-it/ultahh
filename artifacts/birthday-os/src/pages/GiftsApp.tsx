import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import confetti from "canvas-confetti";

export default function GiftsApp() {
  const { content } = useAdmin();
  const [openedGifts, setOpenedGifts] = useState<number[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const BASE = import.meta.env.BASE_URL;

  const gifts = content.gifts;

  const handleOpenGift = (idx: number, event: React.MouseEvent) => {
    if (openedGifts.includes(idx)) return;
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ particleCount: 100, spread: 70, origin: { x, y }, colors: ["#FFB6D9", "#E8F4FF", "#ffffff", "#D8B4E2"] });
    setOpenedGifts(prev => [...prev, idx]);
    setActiveIdx(idx);
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] relative pb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB6D9]/15 rounded-full blur-[60px] pointer-events-none" />

      <div className="px-5 pt-5 pb-2 relative z-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            Hadiah
          </h1>
          <p className="text-foreground/50 text-sm mt-1">Ketuk setiap hadiah untuk membukanya 🎁</p>
        </div>
        {/* Teddy bear decoration */}
        <motion.img
          src={`${BASE}deco/teddy.png`} alt=""
          className="w-16 h-16 object-contain select-none"
          animate={{ y: [0, -4, 0], rotate: [0, 3, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        />
      </div>

      <div className="flex flex-wrap justify-center gap-14 md:gap-16 max-w-4xl mx-auto px-4 mt-8 relative z-10">
        {gifts.map((g, i) => {
          const isOpened = openedGifts.includes(i);
          return (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              animate={isOpened ? { scale: 0.88, opacity: 0.45 } : { y: [0, -8, 0] }}
              transition={isOpened ? {} : { repeat: Infinity, duration: 3, delay: i * 0.4, ease: "easeInOut" }}
              onClick={e => handleOpenGift(i, e)}
              whileHover={!isOpened ? { scale: 1.1 } : {}}
            >
              <div className={`w-32 h-32 md:w-40 md:h-40 ${g.colorClass} rounded-2xl shadow-2xl relative overflow-hidden border border-[#FFB6D9]/30`}>
                <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-5 ${g.bowClass}`} />
                <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-5 ${g.bowClass}`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full ${g.bowClass} shadow-inner`} />
              </div>
              {!isOpened && (
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-foreground/50 text-xs font-medium whitespace-nowrap">
                  Ketuk untuk buka
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Balloon + tulip decoration */}
      <motion.div
        className="flex justify-center mt-12 gap-3 relative z-10 items-end"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      >
        <motion.img src={`${BASE}deco/balloon-pink.png`} alt="" className="w-16 object-contain select-none"
          animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} />
        <img src={`${BASE}deco/tulips.png`} alt="" className="w-24 object-contain" />
        <img src={`${BASE}deco/tulips2.png`} alt="" className="w-24 object-contain" />
        <motion.img src={`${BASE}deco/balloon-bear.png`} alt="" className="w-20 object-contain select-none"
          animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.7 }} />
      </motion.div>

      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-white/60 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              className="glass-white max-w-sm w-full rounded-3xl p-8 flex flex-col items-center gap-5 text-center border border-[#FFB6D9]/40 shadow-2xl relative"
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FFB6D9]/20 transition-colors cursor-pointer" onClick={() => setActiveIdx(null)}>
                <X className="w-4 h-4 text-foreground/50" />
              </button>

              <motion.img
                src={`${BASE}chars/face-pink.jpg`} alt=""
                className="w-20 h-20 rounded-full object-cover object-top border-4 border-white shadow-xl"
                style={{ boxShadow: "0 0 0 4px #FFB6D9" }}
                initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, delay: 0.1 }}
              />
              <p className="text-foreground/80 text-base leading-relaxed font-serif italic">
                {activeIdx !== null ? (gifts[activeIdx]?.text ?? "Hadiah untukmu! 🌸") : ""}
              </p>
              {activeIdx === 0 && (
                <img src={`${BASE}deco/tulips.png`} alt="Bunga" className="w-32 h-32 object-contain" />
              )}
              <button onClick={() => setActiveIdx(null)}
                className="mt-2 px-6 py-2 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white rounded-full text-sm font-semibold transition-colors cursor-pointer shadow">
                Terima Kasih! ♡
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
