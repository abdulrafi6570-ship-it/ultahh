import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export default function MusicApp() {
  const { content } = useAdmin();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const BASE = import.meta.env.BASE_URL;

  const coverSrc = content.coverImage || `${BASE}images/cover.png`;
  const hasAudio = Boolean(content.audioObjectUrl);

  // Sync audio element when URL changes
  useEffect(() => {
    if (content.audioObjectUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      a.src = content.audioObjectUrl;
      a.onloadedmetadata = () => setDuration(a.duration);
      a.ontimeupdate = () => {
        setCurrentTime(a.currentTime);
        setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      };
      a.onended = () => { setIsPlaying(false); setProgress(0); };
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [content.audioObjectUrl]);

  // Fallback simulated progress when no audio file
  const [durMin, durSec] = (content.songDuration || "3:47").split(":").map(Number);
  const totalSecs = hasAudio ? duration : ((durMin || 3) * 60 + (durSec || 47));

  useEffect(() => {
    if (hasAudio) return; // real audio handles its own progress
    let t: NodeJS.Timeout;
    if (isPlaying) {
      t = setInterval(() => setProgress(p => {
        if (p >= 100) { setIsPlaying(false); return 0; }
        return p + (100 / totalSecs);
      }), 1000);
    }
    return () => clearInterval(t);
  }, [isPlaying, totalSecs, hasAudio]);

  const togglePlay = () => {
    if (hasAudio && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(() => {});
    }
    setIsPlaying(p => !p);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAudio || !audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = x * duration;
  };

  const elapsed = hasAudio ? currentTime : Math.floor((progress / 100) * totalSecs);
  const eMin = Math.floor(elapsed / 60);
  const eSec = (Math.floor(elapsed) % 60).toString().padStart(2, "0");
  const totalStr = hasAudio && duration ? `${Math.floor(duration/60)}:${(Math.floor(duration)%60).toString().padStart(2,"0")}` : content.songDuration;

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center pb-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 glass-white p-6 rounded-3xl border border-[#FFB6D9]/30 shadow-xl">
        {/* Album Art + Vinyl */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          <motion.div
            className="absolute right-0 w-52 h-52 rounded-full bg-black border-4 border-gray-900 flex items-center justify-center shadow-xl"
            animate={{ rotate: isPlaying ? 360 : 0, x: isPlaying ? 24 : 0 }}
            transition={{ rotate: { repeat: Infinity, duration: 4, ease: "linear" }, x: { type: "spring", damping: 20 } }}
          >
            <div className="absolute w-16 h-16 rounded-full bg-[#FFB6D9] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-black" />
            </div>
          </motion.div>
          <motion.div className="absolute left-0 z-10 w-52 h-52 rounded-2xl overflow-hidden shadow-2xl"
            animate={{ scale: isPlaying ? 1.04 : 1 }}>
            <img src={coverSrc} alt="Cover" className="w-full h-full object-cover" />
          </motion.div>
        </div>

        {/* Info */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">{content.songTitle}</h2>
          <p className="text-[#D45A8F] text-sm font-medium mt-0.5">{content.songArtist}</p>
          {hasAudio
            ? <p className="text-green-500 text-[10px] font-mono tracking-widest uppercase mt-0.5">🎵 file audio aktif</p>
            : <p className="text-foreground/40 text-[10px] font-mono tracking-widest uppercase mt-0.5">birthday.os</p>}
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="w-full h-1.5 bg-[#FFB6D9]/20 rounded-full overflow-hidden cursor-pointer" onClick={handleSeek}>
            <motion.div className="h-full bg-[#FFB6D9] rounded-full" style={{ width: `${progress}%` }} layout />
          </div>
          <div className="flex justify-between text-[11px] text-foreground/50 font-mono">
            <span>{eMin}:{eSec}</span>
            <span>{totalStr}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-7">
          <button className="text-foreground/60 hover:text-[#D45A8F] transition-colors cursor-pointer"
            onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; setProgress(0); }}>
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          <button
            className="w-14 h-14 flex items-center justify-center bg-[#FFB6D9] text-white rounded-full shadow-[0_0_18px_rgba(255,182,217,0.4)] hover:scale-105 hover:bg-[#D45A8F] transition-all cursor-pointer border-2 border-white"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
          <button className="text-foreground/60 hover:text-[#D45A8F] transition-colors cursor-pointer">
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* EQ */}
        <div className="flex gap-1 h-5 items-end">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.div key={i} className="w-1 bg-[#FFB6D9] rounded-full"
              animate={isPlaying ? { height: ["20%","100%","40%","80%","20%"] } : { height: "10%" }}
              transition={{ repeat: Infinity, duration: 0.8 + i * 0.12, delay: i * 0.1 }} />
          ))}
        </div>

        {/* Lyrics */}
        <div className="w-full text-center space-y-2 font-serif italic text-foreground/60 text-xs">
          <p>di setiap momen tenang, aku memikirkanmu</p>
          <p className="text-foreground text-sm font-medium not-italic py-1">selamat ulang tahun, sayang — lagu ini untukmu</p>
          <p>semoga kau merasakan semua kehangatan ini</p>
        </div>
      </div>
    </div>
  );
}
