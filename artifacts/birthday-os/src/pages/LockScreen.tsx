import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import ParticleField from "@/components/ParticleField";

export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const dateString = time.toLocaleDateString("id-ID", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-between py-24 z-40 overflow-hidden bg-black"
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <AuroraBackground />
      <ParticleField />

      <motion.div
        className="flex flex-col items-center gap-6 mt-12 z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="w-36 h-36 rounded-full overflow-hidden border border-white/20 shadow-[0_0_40px_rgba(255,182,217,0.3)] backdrop-blur-md">
          <img
            src={`${import.meta.env.BASE_URL}images/portrait.png`}
            alt="Foto"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-center text-center drop-shadow-lg">
          <h1 className="text-7xl font-thin tracking-tighter text-white">{timeString}</h1>
          <p className="text-xl font-light text-white/80 mt-2 capitalize">{dateString}</p>
        </div>
      </motion.div>

      <motion.div
        className="z-10 mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <button onClick={onUnlock} className="flex flex-col items-center gap-2 group cursor-pointer">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ChevronUp className="w-6 h-6 text-white/60 group-hover:text-white transition-colors" />
          </motion.div>
          <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-2 border-[#FFB6D9]/30 shadow-[0_0_20px_rgba(255,182,217,0.15)] group-hover:bg-white/10 group-hover:border-[#FFB6D9]/50 transition-all duration-300">
            <span className="text-white/90 font-medium tracking-wide">Buka</span>
            <span>❤️</span>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}
