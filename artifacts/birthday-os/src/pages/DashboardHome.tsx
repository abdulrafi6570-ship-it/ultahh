import { motion } from "framer-motion";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Balloons } from "@/components/ui/balloons";
import { useRef, useState, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";

export default function DashboardHome({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { content } = useAdmin();
  const balloonsRef = useRef<{ launchAnimation: () => void }>(null);
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");
  const BASE = import.meta.env.BASE_URL;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      setDateStr(now.toLocaleDateString("id-ID", { weekday: "long", month: "long", day: "numeric" }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const portraitSrc = content.portraitImage || `${BASE}images/portrait.png`;

  const cards = [
    { emoji: "🎁", title: "Hadiah Menunggumu",    desc: "Buka hadiahmu satu per satu",          action: "Buka →",      nav: "gifts",    style: "glass-white" },
    { emoji: "🌌", title: "Pesan di Bintang",      desc: "Ketuk bintang untuk baca pesannya",    action: "Lihat →",     nav: "sky",      style: "glass-pink" },
    { emoji: "⭐", title: "Kenangan Kita",         desc: "Timeline momen-momen indah",           action: "Ingat →",     nav: "memories", style: "glass-white" },
    { emoji: "🎵", title: "Playlist Ulang Tahun",  desc: "Satu lagu, khusus untukmu.",           action: "Dengarkan →", nav: "music",    style: "glass-pink" },
    { emoji: "📷", title: "Galeri",                desc: "Koleksi foto yang indah",              action: "Lihat →",     nav: "gallery",  style: "glass-white" },
    { emoji: "🎂", title: "Ucapkan Keinginan",     desc: "Tiup lilin dan buat permintaan.",      action: "Tiup →",      nav: "cake",     style: "glass-pink" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full relative">
      <Balloons ref={balloonsRef as any} type="default" />

      {/* Bunting garland banner */}
      <motion.img
        src={`${BASE}deco/bunting.png`} alt=""
        className="w-full object-contain select-none pointer-events-none -mb-2"
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      />

      {/* Hero */}
      <motion.div
        className="glass-white rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-5 border border-[#FFB6D9]/30 shadow-xl overflow-visible relative"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#FFB6D9]/15 blur-[50px] pointer-events-none" />

        {/* Face sticker yellow — top left */}
        <motion.img
          src={`${BASE}chars/face-yellow.jpg`} alt=""
          className="absolute -top-6 -left-4 w-16 h-16 rounded-full object-cover select-none pointer-events-none z-20 shadow-lg border-2 border-white"
          style={{ boxShadow: "0 0 0 3px #FFE566, 0 4px 12px rgba(0,0,0,0.15)" }}
          animate={{ rotate: [-6, 0, -6], y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        {/* Face sticker blue — top right */}
        <motion.img
          src={`${BASE}chars/face-blue.jpg`} alt=""
          className="absolute -top-5 right-3 w-14 h-14 rounded-full object-cover select-none pointer-events-none z-20 shadow-lg border-2 border-white"
          style={{ boxShadow: "0 0 0 3px #4A90E2, 0 4px 12px rgba(0,0,0,0.15)" }}
          animate={{ rotate: [5, -2, 5], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }}
        />
        {/* Calendar sticker Aug 18 */}
        <motion.img
          src={`${BASE}deco/calendar-818.png`} alt=""
          className="absolute -bottom-6 -left-3 w-20 object-contain select-none pointer-events-none z-20"
          animate={{ rotate: [-4, 2, -4], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
        />

        {/* Portrait with TARGET frame */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0">
          <img src={`${BASE}stickers/target.png`} alt="" className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none select-none" />
          <motion.div
            className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-xl"
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring" }}
          >
            <img src={portraitSrc} alt="Foto" className="w-full h-full object-cover" />
          </motion.div>
        </div>

        {/* Text + CTA */}
        <div className="flex flex-col gap-3 flex-1 relative z-10 text-center sm:text-left">
          <div>
            <p className="text-[#D45A8F] font-mono text-[10px] tracking-widest uppercase mb-1">🎂 Hari Spesialmu</p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                background: "linear-gradient(135deg, #D45A8F, #FF8CBA)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
              Selamat<br />Ulang Tahun!
            </h1>
            {/* seonghyeon button */}
            <motion.img
              src={`${BASE}chars/btn-name.jpg`} alt="seonghyeon"
              className="h-8 object-contain mt-2 mx-auto sm:mx-0 select-none"
              style={{ mixBlendMode: "multiply", imageRendering: "pixelated" }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            />
            <p className="text-foreground/55 mt-2 text-sm leading-relaxed">
              Semua ini dibuat spesial untukmu. Jelajahi setiap bagiannya. 🌸
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            <LiquidButton onClick={() => onNavigate("letter")} variant="default" size="lg">💌 Baca Suratnya</LiquidButton>
            <LiquidButton onClick={() => balloonsRef.current?.launchAnimation()} variant="ghost" size="lg">🎈 Balon</LiquidButton>
          </div>
        </div>
      </motion.div>

      {/* Clock */}
      <motion.div
        className="glass-pink rounded-2xl px-5 py-3 flex items-center justify-between border border-[#FFB6D9]/30 shadow-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      >
        <div>
          <p className="text-foreground/50 text-[11px] font-mono uppercase tracking-widest capitalize">{dateStr}</p>
          <p className="text-2xl font-bold text-[#D45A8F] font-mono tracking-tight">{time}</p>
        </div>
        <div className="text-3xl select-none">✨</div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <motion.div
            key={card.nav}
            className={`${card.style} rounded-2xl p-4 flex flex-col gap-1.5 shadow-sm border border-[#FFB6D9]/20`}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}
          >
            <div className="text-2xl">{card.emoji}</div>
            <h3 className="text-sm font-bold text-foreground leading-snug">{card.title}</h3>
            <p className="text-foreground/50 text-xs flex-1 leading-relaxed">{card.desc}</p>
            <button
              onClick={() => onNavigate(card.nav)}
              className="mt-1 self-start text-xs font-semibold px-3 py-1.5 rounded-full border border-[#FFB6D9] text-[#D45A8F] hover:bg-[#FFB6D9]/20 transition cursor-pointer"
            >{card.action}</button>
          </motion.div>
        ))}
      </div>

      {/* HAPPY BIRTHDAY! text sticker */}
      <motion.img
        src={`${BASE}deco/hbd-text.png`} alt=""
        className="w-full max-w-xs mx-auto object-contain select-none pointer-events-none -my-1"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, type: "spring" }}
        style={{ filter: "drop-shadow(0 4px 12px rgba(212,90,143,0.2))" }}
      />

      {/* Bottom decorative strip: retro poster + cat */}
      <motion.div
        className="relative flex items-end justify-between gap-3 mt-1 overflow-visible"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        {/* Retro poster card */}
        <motion.div
          className="glass-white rounded-2xl overflow-hidden border border-[#FFB6D9]/30 shadow-xl flex-1 max-w-[54%]"
          animate={{ rotate: [-1.5, 0.5, -1.5] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
        >
          <img src={`${BASE}chars/poster.jpg`} alt="poster" className="w-full h-auto object-cover" />
          <div className="px-3 py-2 bg-white/80">
            <p className="text-[10px] font-mono text-[#D45A8F] font-bold tracking-wider">✦ LEVI'S DAY ✦</p>
          </div>
        </motion.div>

        {/* Cat with tulips — right side */}
        <div className="flex flex-col items-center gap-1 flex-1">
          <motion.img
            src={`${BASE}deco/cat-tulips.png`} alt="cat"
            className="w-full max-w-[140px] object-contain select-none drop-shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
          />
          <p className="text-[10px] text-foreground/40 font-medium">untuk kamu 🌷</p>
        </div>
      </motion.div>

      {/* Year 2026 + bear balloons strip */}
      <motion.div
        className="flex items-center justify-center gap-4 -my-1"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >
        <motion.img src={`${BASE}deco/balloon-bear.png`} alt="" className="w-20 object-contain select-none pointer-events-none"
          animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }} />
        <motion.img src={`${BASE}deco/year-2026.png`} alt="2026" className="w-28 object-contain select-none pointer-events-none"
          animate={{ rotate: [-1, 1, -1] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} />
        <motion.img src={`${BASE}deco/balloon-pink.png`} alt="" className="w-14 object-contain select-none pointer-events-none"
          animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }} />
      </motion.div>

      {/* Voice note CTA */}
      <motion.button
        onClick={() => onNavigate("voice")}
        className="w-full glass-white rounded-2xl border border-[#FFB6D9]/30 shadow-sm overflow-hidden flex items-center gap-3 p-3 hover:shadow-md transition-shadow cursor-pointer"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
      >
        <img src={`${BASE}deco/vn-wave.png`} alt="vn" className="h-12 w-auto object-contain rounded-xl flex-shrink-0" />
        <div className="text-left">
          <p className="text-sm font-bold text-foreground">Voice Note Untukmu</p>
          <p className="text-xs text-foreground/50">Ada pesan yang direkam khusus 🎤</p>
        </div>
        <span className="ml-auto text-[#D45A8F] font-bold text-sm flex-shrink-0">Dengar →</span>
      </motion.button>
    </div>
  );
}
