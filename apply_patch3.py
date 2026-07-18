import sys

path = "artifacts/birthday-os/src/pages/MemoriesApp.tsx"

new_content = '''import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin, MemoryCard } from "@/contexts/AdminContext";

function MemoryCardComp({ mem, imgSrc, index, onOpen }: { mem: MemoryCard; imgSrc: string; index: number; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div ref={ref}
      className="glass-white rounded-2xl p-4 flex flex-col gap-3 border border-[#FFB6D9]/30 shadow-sm cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", damping: 22, delay: Math.min(index * 0.05, 0.3) }}
      onClick={onOpen}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-[#FFB6D9]/15">
        <img src={imgSrc} alt={mem.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div>
        <div className="text-[#D45A8F] text-[11px] font-mono mb-1">{mem.date}</div>
        <h3 className="text-base font-bold text-foreground mb-1">{mem.title}</h3>
        <p className="text-foreground/60 text-sm leading-relaxed">{mem.desc}</p>
      </div>
    </motion.div>
  );
}

export default function MemoriesApp() {
  const { content } = useAdmin();
  const BASE = import.meta.env.BASE_URL;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const memories = content.memoryCards;

  const getImgSrc = (i: number) => memories[i].img || `${BASE}images/memory-${(i % 5) + 1}.png`;

  return (
    <div className="w-full pb-4">
      <div className="py-4 relative">
        <motion.img
          src={`${BASE}deco/denim-board.png`} alt=""
          className="absolute -right-2 top-0 w-28 object-contain select-none pointer-events-none"
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.1))" }}
        />
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
          Kenangan Kita
        </h1>
        <p className="text-foreground/50 text-xs mt-0.5">Timeline momen-momen indah ✨ · {memories.length} kenangan</p>
      </div>
      <div className="flex flex-col gap-4">
        {memories.map((mem, i) => (
          <MemoryCardComp key={i} mem={mem} index={i}
            imgSrc={getImgSrc(i)} onOpen={() => setSelectedIdx(i)} />
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedIdx(null)}
          >
            <motion.div
              className="relative max-w-sm w-full"
              initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer" onClick={() => setSelectedIdx(null)}>
                <X className="w-4 h-4" />
              </button>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer"
                onClick={() => setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer"
                onClick={() => setSelectedIdx(i => i !== null ? Math.min(memories.length - 1, i + 1) : null)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-black">
                <img
                  src={getImgSrc(selectedIdx)}
                  alt={memories[selectedIdx].title}
                  className="w-full h-auto max-h-[65vh] object-contain bg-black"
                />
                <div className="bg-black/80 px-4 py-3 text-center">
                  <p className="text-[#FFB6D9] text-[11px] font-mono mb-1">{memories[selectedIdx].date}</p>
                  <p className="text-white font-bold text-sm mb-1">{memories[selectedIdx].title}</p>
                  {memories[selectedIdx].desc && (
                    <p className="text-white/70 text-xs leading-relaxed italic">{memories[selectedIdx].desc}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
'''

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("PATCH BERHASIL diterapkan ke " + path)
