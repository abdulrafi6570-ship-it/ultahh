import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCursorParticles } from "@/hooks/useCursorParticles";
import { AdminProvider } from "@/contexts/AdminContext";

import LoadingScreen from "@/pages/LoadingScreen";
import AdminPanel from "@/pages/AdminPanel";
import TutorialOverlay, { useShouldShowTutorial } from "@/pages/TutorialOverlay";

import { Navbar } from "@/components/Navbar";
import DashboardHome from "@/pages/DashboardHome";
import GalleryApp from "@/pages/GalleryApp";
import LetterApp from "@/pages/LetterApp";
import MusicApp from "@/pages/MusicApp";
import MemoriesApp from "@/pages/MemoriesApp";
import SkyApp from "@/pages/SkyApp";
import GiftsApp from "@/pages/GiftsApp";
import BirthdayCakeApp from "@/pages/BirthdayCakeApp";
import VoiceApp from "@/pages/VoiceApp";
import FinalScene from "@/pages/FinalScene";
import TwiboonApp from "@/pages/TwiboonApp";

type AppPhase = "loading" | "app";

type SectionState =
  | "home" | "gallery" | "letter" | "music" | "memories"
  | "sky" | "gifts" | "cake" | "voice" | "twiboon" | "finale";

function AppInner() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [currentSection, setCurrentSection] = useState<SectionState>("home");
  const [muted, setMuted] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const { show: showTutorial, setShow: setShowTutorial } = useShouldShowTutorial();

  useCursorParticles();

  const handleNavigate = (section: string) => setCurrentSection(section as SectionState);
  const triggerFinale = () => setCurrentSection("finale");

  return (
    <div className="min-h-screen w-full font-sans">
      {/* Pink loading screen — keep, skip boot terminal */}
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <LoadingScreen key="loading" onComplete={() => setPhase("app")} />
        )}
      </AnimatePresence>

      {phase !== "loading" && (
      <div className="fixed inset-0 flex flex-col overflow-hidden">

        {/* Twiboon gets its own full-height layer (not inside scrollable main) */}
        <AnimatePresence>
          {currentSection === "twiboon" && (
            <motion.div
              key="twiboon-layer"
              className="absolute inset-x-0 top-0 z-[40] overflow-hidden"
              style={{ bottom: "6rem" }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <TwiboonApp />
            </motion.div>
          )}
        </AnimatePresence>

      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="pt-4 pb-6 px-3 sm:px-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full"
            >
              {currentSection === "home"     && <DashboardHome onNavigate={handleNavigate} />}
              {currentSection === "gallery"  && <GalleryApp />}
              {currentSection === "letter"   && <LetterApp />}
              {currentSection === "music"    && <MusicApp />}
              {currentSection === "memories" && <MemoriesApp />}
              {currentSection === "sky"      && <SkyApp />}
              {currentSection === "gifts"    && <GiftsApp />}
              {currentSection === "cake"     && <BirthdayCakeApp onFinale={triggerFinale} />}
              {currentSection === "voice"    && <VoiceApp />}
              {currentSection === "finale"   && <FinalScene />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Navbar
        currentSection={currentSection}
        onNavigate={handleNavigate}
        muted={muted}
        onToggleMute={() => setMuted(!muted)}
        onOpenAdmin={() => setShowAdmin(true)}
      />

      {/* Tutorial — shown once on first visit */}
      <AnimatePresence>
        {showTutorial && !showAdmin && (
          <TutorialOverlay key="tutorial" onDone={() => setShowTutorial(false)} />
        )}
      </AnimatePresence>

      {/* Tutorial hint button */}
      <AnimatePresence>
        {!showTutorial && !showAdmin && (
          <motion.button
            key="tutorial-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowTutorial(true)}
            className="fixed bottom-[7.5rem] right-4 z-[120] w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm border border-[#FFB6D9]/40 shadow-md flex items-center justify-center text-[#D45A8F] font-bold text-sm hover:bg-[#FFB6D9]/20 transition-colors cursor-pointer select-none"
            aria-label="Panduan"
          >
            ?
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmin && <AdminPanel key="admin" onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>
      </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppInner />
    </AdminProvider>
  );
}
