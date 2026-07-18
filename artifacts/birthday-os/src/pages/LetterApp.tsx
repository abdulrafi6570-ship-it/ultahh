import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useAdmin } from "@/contexts/AdminContext";

type Tab = "surat" | "alasan";

export default function LetterApp() {
  const { content } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("surat");
  const { displayedText } = useTypewriter(isOpen && activeTab === "surat" ? content.letterText : "", 30, 600);
  const letterScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = letterScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [displayedText]);

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col relative pb-16">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#FFB6D9]/30 to-[#FFD6E8]/30 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="p-6 flex gap-4 items-center relative z-10">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
          Surat Untukmu
        </h1>
        {isOpen && (
          <div className="flex gap-2 ml-auto">
            {(["surat", "alasan"] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-[#FFB6D9] text-white shadow"
                    : "bg-white/60 text-foreground/60 hover:bg-[#FFB6D9]/20"
                }`}
              >
                {tab === "surat" ? "💌 Surat" : "💯 100 Alasan"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <div className="relative flex flex-col items-center gap-4 mt-4 w-full max-w-md">
              {/* Bear peeking over envelope */}
              <motion.img
                src={`${import.meta.env.BASE_URL}deco/bear-letter.png`}
                alt=""
                className="w-48 object-contain select-none pointer-events-none"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              />
              <motion.div
                key="envelope"
                className="w-full aspect-[4/3] bg-[#EAE2D6] rounded-2xl shadow-2xl relative cursor-pointer flex items-center justify-center border border-[#d4c9b9]"
                onClick={() => setIsOpen(true)}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0, y: 80 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div
                    className="absolute top-0 left-0 right-0 h-1/2 bg-[#F5F0E6] border-b border-[#d4c9b9]"
                    style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                  />
                </div>
                <div className="z-10 w-16 h-16 bg-[#D45A8F] rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">♡</span>
                </div>
                <p className="absolute bottom-6 text-[#8c8273] font-serif italic text-sm">Ketuk untuk membuka</p>
              </motion.div>
            </div>
          ) : (
            <motion.div
              key="opened"
              className="w-full max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "surat" && (
                  <motion.div
                    key="surat"
                    ref={letterScrollRef}
                    className="w-full max-h-[75vh] bg-[#FDFBF7] rounded-2xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,182,217,0.15)] overflow-y-auto border border-[#FFB6D9]/20 scroll-smooth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", damping: 25 }}
                  >
                    <div className="text-[#3a3530] font-serif text-lg leading-relaxed whitespace-pre-wrap">
                      {displayedText}
                      <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>|</motion.span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "alasan" && (
                  <motion.div
                    key="alasan"
                    className="w-full max-h-[75vh] overflow-y-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {content.reasons.map((reason, i) => (
                        <motion.div
                          key={i}
                          className="glass-white rounded-xl p-4 flex gap-3 items-start border border-[#FFB6D9]/20 shadow-sm"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.5) }}
                        >
                          <span
                            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                            style={{ background: "linear-gradient(135deg, #FFB6D9, #D45A8F)" }}
                          >
                            {i + 1}
                          </span>
                          <p className="text-foreground/80 text-sm leading-relaxed pt-1 font-serif italic">{reason}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
