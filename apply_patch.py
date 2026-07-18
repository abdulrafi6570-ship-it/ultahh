import re, sys

path = "artifacts/birthday-os/src/App.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old = """function AppInner() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [currentSection, setCurrentSection] = useState<SectionState>("home");
  const [muted, setMuted] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const { show: showTutorial, setShow: setShowTutorial } = useShouldShowTutorial();

  useCursorParticles();

  const handleNavigate = (section: string) => setCurrentSection(section as SectionState);
  const triggerFinale = () => setCurrentSection("finale");"""

new = """function AppInner() {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const [currentSection, setCurrentSection] = useState<SectionState>("home");
  const [muted, setMuted] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const { show: showTutorial, setShow: setShowTutorial } = useShouldShowTutorial();
  const { content } = useAdmin();
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  useCursorParticles();

  useEffect(() => {
    if (!bgAudioRef.current) bgAudioRef.current = new Audio();
    const audio = bgAudioRef.current;
    audio.loop = true;
    if (content.audioObjectUrl && audio.src !== content.audioObjectUrl) {
      audio.src = content.audioObjectUrl;
    }
    return () => {
      audio.pause();
    };
  }, [content.audioObjectUrl]);

  useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio || !content.audioObjectUrl) return;
    if (muted || currentSection === "music") {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [muted, currentSection, content.audioObjectUrl]);

  const handleNavigate = (section: string) => setCurrentSection(section as SectionState);
  const triggerFinale = () => setCurrentSection("finale");"""

if old not in src:
    print("PATCH GAGAL: blok kode lama nggak ketemu persis.")
    sys.exit(1)

src2 = src.replace(old, new, 1)
with open(path, "w", encoding="utf-8") as f:
    f.write(src2)

print("PATCH BERHASIL diterapkan ke " + path)
