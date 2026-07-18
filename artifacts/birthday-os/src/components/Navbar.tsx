import { useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/contexts/AdminContext";

const tabs = [
  { id: "home",     label: "Beranda",    icon: "🏠" },
  { id: "gallery",  label: "Galeri",     icon: "📷" },
  { id: "letter",   label: "Surat",      icon: "💌" },
  { id: "music",    label: "Musik",      icon: "🎵" },
  { id: "memories", label: "Kenangan",   icon: "⭐" },
  { id: "sky",      label: "Langit",     icon: "🌌" },
  { id: "gifts",    label: "Hadiah",     icon: "🎁" },
  { id: "cake",     label: "Kue",        icon: "🎂" },
  { id: "voice",    label: "Suara",      icon: "🎤" },
  { id: "twiboon",  label: "Twiboon",    icon: "🖼️" },
];

// Secret: tap the portrait photo 5 times quickly to open admin
const SECRET_TAPS = 5;
const SECRET_WINDOW_MS = 3000;

export function Navbar({
  currentSection, onNavigate, muted, onToggleMute, onOpenAdmin,
}: {
  currentSection: string;
  onNavigate: (section: string) => void;
  muted: boolean;
  onToggleMute: () => void;
  onOpenAdmin: () => void;
}) {
  const { content } = useAdmin();
  const portraitSrc = content.portraitImage || `${import.meta.env.BASE_URL}chars/face-pink.jpg`;

  // Secret tap state
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePortraitTap = () => {
    tapCountRef.current += 1;

    // Reset timer on each tap
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, SECRET_WINDOW_MS);

    if (tapCountRef.current >= SECRET_TAPS) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      onOpenAdmin();
    }
  };

  return (
    <nav className="flex-shrink-0 glass-white border-t border-[#FFB6D9]/20 shadow-[0_-4px_24px_rgba(255,182,217,0.12)]">
      {/* Top strip: logo + avatar + controls */}
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <button
          onClick={() => onNavigate("home")}
          className="font-bold italic text-base leading-none cursor-pointer select-none"
          style={{
            fontFamily: "'Playfair Display', serif",
            background: "linear-gradient(135deg, #FF8CBA, #D45A8F)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}
        >
          {content.siteTitle}
        </button>

        <div className="flex items-center gap-2">
          <button onClick={onToggleMute} className="p-1.5 rounded-full text-foreground/50 hover:text-foreground transition-colors cursor-pointer">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {/* Portrait — secret admin trigger (5 taps within 3 seconds) */}
          <button
            onClick={handlePortraitTap}
            className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 cursor-pointer focus:outline-none"
            aria-label="Profile"
          >
            <img src={portraitSrc} alt="Avatar" className="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      {/* Tabs row */}
      <div className="flex overflow-x-auto pb-2 px-2 gap-0.5 no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={cn(
              "flex flex-col items-center justify-center px-3 py-1 rounded-xl text-center transition-all cursor-pointer flex-shrink-0 min-w-[56px]",
              currentSection === tab.id
                ? "bg-[#FFB6D9]/20 text-[#D45A8F]"
                : "text-foreground/50 hover:text-foreground"
            )}
          >
            <span className="text-lg leading-tight">{tab.icon}</span>
            <span className={cn("text-[10px] font-medium leading-tight mt-0.5",
              currentSection === tab.id ? "text-[#D45A8F]" : "text-foreground/50"
            )}>{tab.label}</span>
          </button>
        ))}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </nav>
  );
}
