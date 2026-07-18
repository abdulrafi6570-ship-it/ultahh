import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Mic } from "lucide-react";
import { loadAllVNs, VNMeta } from "@/lib/vnStorage";

interface VNClip { meta: VNMeta; url: string }

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function VNBubble({ clip, index }: { clip: VNClip; index: number }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const BASE = import.meta.env.BASE_URL;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  const bars = 28;

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: index * 0.12, type: "spring", damping: 22 }}
    >
      <audio
        ref={audioRef}
        src={clip.url}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={e => {
          const a = e.target as HTMLAudioElement;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
      />

      {!revealed ? (
        /* Locked state */
        <motion.button
          onClick={() => setRevealed(true)}
          className="w-full rounded-2xl border border-[#FFB6D9]/40 bg-white/80 p-4 flex items-center gap-3 cursor-pointer hover:bg-[#FFF0F8] transition-colors shadow-sm group"
          animate={{ boxShadow: ["0 0 0px #FFB6D9", "0 0 14px rgba(255,182,217,0.45)", "0 0 0px #FFB6D9"] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: index * 0.3 }}
        >
          <div className="w-10 h-10 rounded-full bg-[#FFB6D9]/20 flex items-center justify-center border border-[#FFB6D9]/40 flex-shrink-0">
            <span className="text-lg">🎤</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-foreground">{clip.meta.label || `VN #${index + 1}`}</p>
            <p className="text-xs text-foreground/45">Ketuk untuk mendengarkan</p>
          </div>
          <img src={`${BASE}deco/vn-wave.png`} alt="" className="h-8 w-auto object-contain opacity-70 flex-shrink-0" />
        </motion.button>
      ) : (
        /* Player */
        <motion.div
          className="rounded-2xl border border-[#FFB6D9]/40 bg-gradient-to-r from-[#FFF0F8] to-white p-4 flex flex-col gap-3 shadow-md"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center gap-3">
            {/* Face sticker */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#FFB6D9]/60 shadow-sm">
              <img src={`${BASE}chars/face-pink.jpg`} alt="" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#D45A8F] truncate">{clip.meta.label || `VN #${index + 1}`}</p>
              <p className="text-[10px] text-foreground/40 font-mono">
                {duration ? formatTime(duration) : "--:--"}
              </p>
            </div>
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-[#FFB6D9] hover:bg-[#D45A8F] flex items-center justify-center shadow-md transition-colors cursor-pointer flex-shrink-0"
            >
              {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-white" />}
            </button>
          </div>

          {/* Waveform bar progress */}
          <div className="flex items-center gap-0.5 h-10 w-full px-1">
            {Array.from({ length: bars }).map((_, i) => {
              const filled = i / bars < progress;
              const height = 20 + Math.sin(i * 0.8) * 14 + Math.sin(i * 1.7) * 10;
              return (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-200 ${filled ? "bg-[#D45A8F]" : "bg-[#FFB6D9]/40"}`}
                  style={{ height: `${height}%` }}
                  animate={playing && !filled ? {
                    height: [`${height}%`, `${Math.min(height + 20, 90)}%`, `${height}%`],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 0.3 + (i % 5) * 0.08, ease: "easeInOut" }}
                />
              );
            })}
          </div>

          {/* Seek bar */}
          <input
            type="range" min={0} max={1} step={0.001} value={progress}
            onChange={e => {
              const a = audioRef.current;
              if (!a || !a.duration) return;
              const v = Number(e.target.value);
              a.currentTime = v * a.duration;
              setProgress(v);
            }}
            className="w-full accent-[#D45A8F] cursor-pointer h-1"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function VoiceApp() {
  const [clips, setClips] = useState<VNClip[]>([]);
  const [loading, setLoading] = useState(true);
  const BASE = import.meta.env.BASE_URL;

  useEffect(() => {
    loadAllVNs().then(c => { setClips(c); setLoading(false); });
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col relative pb-6">
      {/* Background glows */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#FFB6D9]/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#E8F4FF]/25 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="px-5 pt-5 pb-4 relative z-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            Voice Note
          </h1>
          <p className="text-foreground/50 text-sm mt-0.5">pesan yang direkam khusus untukmu 🤍</p>
        </div>
        <img src={`${BASE}chars/face-blue.jpg`} alt=""
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0"
          style={{ boxShadow: "0 0 0 3px #4A90E2" }} />
      </div>

      <div className="flex-1 relative z-10 px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
              <Mic className="w-8 h-8 text-[#FFB6D9]" />
            </motion.div>
            <p className="text-foreground/40 text-sm">Memuat pesan...</p>
          </div>
        ) : clips.length === 0 ? (
          <AnimatePresence>
            <motion.div
              className="flex flex-col items-center justify-center gap-6 py-16 text-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            >
              {/* Decorative */}
              <div className="relative">
                <motion.img
                  src={`${BASE}chars/face-yellow.jpg`} alt=""
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl"
                  style={{ boxShadow: "0 0 0 4px #FFE566, 0 8px 24px rgba(0,0,0,0.12)" }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[#FFB6D9] flex items-center justify-center shadow-lg border-2 border-white"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Mic className="w-5 h-5 text-white" />
                </motion.div>
              </div>

              <div className="glass-white rounded-2xl p-6 max-w-xs border border-[#FFB6D9]/30 shadow-md">
                <img src={`${BASE}deco/vn-wave.png`} alt="" className="h-10 mx-auto mb-3" />
                <p className="text-base font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                  Belum ada pesan
                </p>
                <p className="text-foreground/50 text-sm leading-relaxed">
                  Admin belum upload voice note. Masuk ke panel admin → tab Suara untuk upload.
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-foreground/40 font-medium px-1 mb-1">{clips.length} pesan menunggumu</p>
            {clips.map((clip, i) => (
              <VNBubble key={clip.meta.id} clip={clip} index={i} />
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
