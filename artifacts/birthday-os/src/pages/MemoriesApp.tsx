import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAdmin, MemoryCard } from "@/contexts/AdminContext";

function MemoryCardComp({ mem, imgSrc, index }: { mem: MemoryCard; imgSrc: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div ref={ref}
      className="glass-white rounded-2xl p-4 flex flex-col gap-3 border border-[#FFB6D9]/30 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={visible ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", damping: 22, delay: Math.min(index * 0.05, 0.3) }}
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
        <p className="text-foreground/50 text-xs mt-0.5">Timeline momen-momen indah ✨ · {content.memoryCards.length} kenangan</p>
      </div>
      <div className="flex flex-col gap-4">
        {content.memoryCards.map((mem, i) => (
          <MemoryCardComp key={i} mem={mem} index={i}
            imgSrc={mem.img || `${BASE}images/memory-${(i % 5) + 1}.png`} />
        ))}
      </div>
    </div>
  );
}
