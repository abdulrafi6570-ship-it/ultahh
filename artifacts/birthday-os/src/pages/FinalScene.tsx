import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

const finalLines = [
  "selamat ulang tahun.",
  "terima kasih sudah ada.",
  "semoga harimu selalu dipenuhi kebahagiaan.",
  "tetaplah tersenyum.",
  "tetaplah bersinar.",
  "dan selalu ingat...",
  "kamu adalah seseorang yang sungguh istimewa.",
  "♡",
];

export default function FinalScene() {
  const [currentLine, setCurrentLine] = useState(0);
  const [showHeart, setShowHeart] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  useEffect(() => {
    if (currentLine < finalLines.length) {
      const timer = setTimeout(() => setCurrentLine(prev => prev + 1), 3500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowHeart(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentLine]);

  const handleHeartTap = () => {
    if (showEasterEgg) return;
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (navigator.vibrate) navigator.vibrate(50);
    if (newCount >= 10) {
      setShowEasterEgg(true);
      confetti({
        particleCount: 200, spread: 160, origin: { y: 0.6 },
        colors: ["#FFB6D9", "#E8F4FF", "#ffffff", "#FFD6E8"],
      });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] relative bg-[#050507] rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center pb-16">
      <motion.div
        className="absolute inset-0 z-0 opacity-20 blur-xl"
        animate={{ scale: [1, 1.2] }}
        transition={{ duration: 30, ease: "linear" }}
      >
        <img src={`${import.meta.env.BASE_URL}images/portrait.png`} alt="" className="w-full h-full object-cover" />
      </motion.div>

      <div className="z-10 px-8 max-w-2xl flex flex-col items-center justify-center min-h-[50vh]">
        <AnimatePresence mode="wait">
          {currentLine < finalLines.length ? (
            <motion.p
              key={currentLine}
              className="text-3xl md:text-4xl text-[#FFB6D9] leading-relaxed drop-shadow-md"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 1.5 }}
            >
              {finalLines[currentLine]}
            </motion.p>
          ) : showHeart ? (
            <motion.div
              key="heart-section"
              className="flex flex-col items-center gap-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            >
              <div className="relative">
                {tapCount > 0 && !showEasterEgg && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono">
                    {tapCount}/10
                  </div>
                )}
                <motion.div
                  className="text-6xl cursor-pointer select-none"
                  animate={{ scale: [1, 1.1, 1], textShadow: ["0 0 20px #FFB6D9", "0 0 40px #FFB6D9", "0 0 20px #FFB6D9"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  onClick={handleHeartTap}
                  whileTap={{ scale: 0.88 }}
                >
                  ❤️
                </motion.div>
              </div>
              <div className="text-white/40 font-serif italic text-sm">Dibuat dengan cinta.</div>
              {showEasterEgg && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-6 glass-panel rounded-2xl border-[#FFB6D9]/30 bg-[#FFB6D9]/10 max-w-md"
                >
                  <p className="text-[#FFB6D9] font-medium leading-relaxed">
                    kamu menemukan easter egg! itu artinya kamu menekan 10 kali yang berarti kamu BENAR-BENAR suka ini. 🥹 selamat ulang tahun!
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full z-0"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 0.5, 0], scale: [0, 1.5, 0] }}
          transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, delay: Math.random() * 5 }}
        />
      ))}
    </div>
  );
}
