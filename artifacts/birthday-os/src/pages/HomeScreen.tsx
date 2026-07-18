import { motion } from "framer-motion";
import { Battery, Wifi, Signal, Volume2, VolumeX } from "lucide-react";
import AuroraBackground from "@/components/AuroraBackground";
import SakuraPetals from "@/components/SakuraPetals";
import { useState, useEffect } from "react";

const apps = [
  { id: "gallery", label: "Gallery", icon: "📷", color: "from-blue-400/20 to-blue-600/20" },
  { id: "letter", label: "Letter", icon: "💌", color: "from-red-400/20 to-red-600/20" },
  { id: "music", label: "Music", icon: "🎵", color: "from-green-400/20 to-green-600/20" },
  { id: "gifts", label: "Gifts", icon: "🎁", color: "from-purple-400/20 to-purple-600/20" },
  { id: "memories", label: "Memories", icon: "⭐", color: "from-yellow-400/20 to-yellow-600/20" },
  { id: "sky", label: "Sky", icon: "🌌", color: "from-indigo-400/20 to-indigo-600/20" },
  { id: "cake", label: "Birthday", icon: "🎂", color: "from-pink-400/20 to-pink-600/20" },
  { id: "voice", label: "Voice", icon: "🎤", color: "from-teal-400/20 to-teal-600/20" },
];

export default function HomeScreen({ 
  onOpenApp, 
  muted, 
  setMuted 
}: { 
  onOpenApp: (app: string) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      className="fixed inset-0 z-30 bg-black"
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <AuroraBackground />
      <SakuraPetals />

      {/* Status Bar */}
      <div className="absolute top-0 inset-x-0 h-12 flex items-center justify-between px-6 text-white/90 text-sm font-medium z-50">
        <div>{time}</div>
        <div className="flex items-center gap-2 text-white/80">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <Battery className="w-5 h-5" />
        </div>
      </div>

      {/* Audio Control */}
      <button 
        onClick={() => setMuted(!muted)}
        className="absolute top-14 right-4 z-50 p-3 glass-panel rounded-full text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* App Grid */}
      <div className="h-full flex flex-col items-center justify-center px-6 md:px-12 pt-20 pb-32">
        <div className="grid grid-cols-4 gap-x-6 gap-y-10 md:gap-x-12 md:gap-y-12 max-w-3xl w-full">
          {apps.map((app, i) => (
            <motion.div
              key={app.id}
              className="flex flex-col items-center gap-3 cursor-pointer group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              onClick={() => onOpenApp(app.id)}
            >
              <motion.div 
                className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl glass-panel flex items-center justify-center text-3xl md:text-4xl shadow-lg relative overflow-hidden group-hover:border-[#FFB6D9]/50 group-hover:shadow-[0_0_30px_rgba(255,182,217,0.3)] transition-all duration-300`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${app.color} opacity-50`}></div>
                <span className="relative z-10">{app.icon}</span>
              </motion.div>
              <span className="text-white/90 text-xs md:text-sm font-medium tracking-wide drop-shadow-md">
                {app.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dock Area */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center">
        <div className="glass-panel px-6 py-4 rounded-3xl flex items-center gap-4 border-white/20">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}