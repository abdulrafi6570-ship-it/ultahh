import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const TUTORIAL_KEY = "birthdayos_tutorial_seen_v1";

const steps = [
  {
    icon: "🏠",
    title: "Beranda",
    desc: "Halaman utama dengan ringkasan semua fitur. Tap kartu untuk langsung pergi ke bagian yang kamu mau.",
  },
  {
    icon: "📷",
    title: "Galeri",
    desc: "Koleksi foto-foto spesial. Geser atau ketuk foto untuk melihatnya lebih besar.",
  },
  {
    icon: "💌",
    title: "Surat",
    desc: "Ada surat yang ditulis khusus untukmu. Baca pelan-pelan ya.",
  },
  {
    icon: "🎵",
    title: "Musik",
    desc: "Satu lagu istimewa dipilih spesial untukmu. Tekan play dan nikmati.",
  },
  {
    icon: "⭐",
    title: "Kenangan",
    desc: "Timeline momen-momen indah yang sudah kita lalui bersama.",
  },
  {
    icon: "🌌",
    title: "Langit",
    desc: "Ketuk bintang-bintang di langit untuk membaca pesan tersembunyi.",
  },
  {
    icon: "🎁",
    title: "Hadiah",
    desc: "Ada beberapa hadiah menantimu! Ketuk setiap kotak hadiah untuk membukanya satu per satu.",
  },
  {
    icon: "🎂",
    title: "Kue",
    desc: "Tiup lilin ulang tahunnya! Hembuskan napas ke mikrofon atau ketuk tombol tiup.",
  },
  {
    icon: "🎤",
    title: "Suara",
    desc: "Pesan suara yang direkam khusus untukmu. Dengarkan satu per satu.",
  },
];

interface TutorialOverlayProps {
  onDone: () => void;
}

export default function TutorialOverlay({ onDone }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const current = steps[step];

  const finish = () => {
    try { localStorage.setItem(TUTORIAL_KEY, "1"); } catch {}
    onDone();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex items-center justify-center p-5"
      style={{ background: "rgba(255,240,248,0.75)", backdropFilter: "blur(16px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={finish}
    >
      <motion.div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#FFB6D9]/30 overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#D45A8F] bg-[#FFB6D9]/20 px-2.5 py-1 rounded-full">
              Panduan
            </span>
          </div>
          <button onClick={finish} className="p-1.5 rounded-full hover:bg-[#FFB6D9]/20 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-foreground/40" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-5 pb-2 min-h-[160px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center text-center gap-3 py-4"
            >
              <div className="text-5xl">{current.icon}</div>
              <div>
                <h3
                  className="text-xl font-bold text-foreground mb-1"
                  style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                >
                  {current.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{current.desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all cursor-pointer ${
                i === step ? "w-5 h-2 bg-[#D45A8F]" : "w-2 h-2 bg-[#FFB6D9]/50"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 px-5 pb-5">
          {!isFirst && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#FFB6D9]/30 text-foreground/60 text-sm font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(s => s + 1)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            {isLast ? "Mulai Explore ♡" : (
              <>Lanjut <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useShouldShowTutorial() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const seen = localStorage.getItem(TUTORIAL_KEY);
      if (!seen) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  return { show, setShow };
}
