import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Save, RotateCcw, Upload, Plus, Trash2, Music, Mic, Play, Pause } from "lucide-react";
import { useAdmin, MemoryCard, Gift } from "@/contexts/AdminContext";
import { compressImage } from "@/utils/compressImage";
import { saveAudioToIDB } from "@/lib/audioStorage";
import { saveVN, loadAllVNs, deleteVN, VNMeta } from "@/lib/vnStorage";

const ADMIN_PASSWORD = "0808";

const sections = [
  { id: "judul",    label: "🏷️ Judul" },
  { id: "loading",  label: "⏳ Loading" },
  { id: "foto",     label: "🖼️ Foto" },
  { id: "galeri",   label: "📷 Galeri" },
  { id: "kenangan", label: "⭐ Kenangan" },
  { id: "surat",    label: "📝 Surat" },
  { id: "alasan",   label: "💯 Alasan" },
  { id: "lagu",     label: "🎵 Lagu" },
  { id: "suara",    label: "🎤 Suara" },
  { id: "lilin",    label: "🎂 Lilin" },
  { id: "bintang",  label: "🌌 Bintang" },
  { id: "hadiah",   label: "🎁 Hadiah" },
];

// Preset color pairs for new gifts
const giftColorPairs = [
  { colorClass: "bg-[#FFB6D9]", bowClass: "bg-white" },
  { colorClass: "bg-[#E8F4FF]", bowClass: "bg-[#FFB6D9]" },
  { colorClass: "bg-[#D8B4E2]", bowClass: "bg-[#E8F4FF]" },
  { colorClass: "bg-white",     bowClass: "bg-[#D8B4E2]" },
  { colorClass: "bg-[#FFE0B2]", bowClass: "bg-[#FFB6D9]" },
  { colorClass: "bg-[#C8E6C9]", bowClass: "bg-white" },
  { colorClass: "bg-[#BBDEFB]", bowClass: "bg-[#FFB6D9]" },
  { colorClass: "bg-[#FFF9C4]", bowClass: "bg-[#D8B4E2]" },
];

function ImgUpload({ label, current, defaultSrc, onUpload, small }: {
  label: string; current: string; defaultSrc: string; onUpload: (b64: string) => void; small?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const preview = current || defaultSrc;
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    try { onUpload(await compressImage(file, 800, 0.78)); }
    catch { alert("Gagal memuat gambar."); } finally { setLoading(false); }
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#FFB6D9]/30 bg-white/70">
      <img src={preview} alt={label} className={`${small ? "w-10 h-10" : "w-14 h-14"} object-cover rounded-lg flex-shrink-0 border border-[#FFB6D9]/20`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-foreground">{label}</p>
        {current && <p className="text-xs text-green-600 mt-0.5 font-medium">✓ aktif</p>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      <button onClick={() => inputRef.current?.click()} disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer flex-shrink-0 disabled:opacity-60">
        <Upload className="w-3 h-3" />{loading ? "..." : "Ganti"}
      </button>
    </div>
  );
}

interface VNClipAdmin { meta: VNMeta; url: string }

export default function AdminPanel({ onClose }: { onClose: () => void }) {
  const { content, isAdmin, setAdmin, updateContent, updateImages, setAudioObjectUrl, resetContent } = useAdmin();
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [activeSection, setActiveSection] = useState("judul");
  const [saved, setSaved]           = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // VN state
  const [vnClips, setVnClips] = useState<VNClipAdmin[]>([]);
  const [vnLoading, setVnLoading] = useState(false);
  const [vnLabel, setVnLabel] = useState("");
  const [playingVnId, setPlayingVnId] = useState<string | null>(null);
  const vnInputRef = useRef<HTMLInputElement>(null);
  const vnAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    if (isAdmin) loadAllVNs().then(setVnClips);
  }, [isAdmin]);

  // Text drafts
  const [siteTitle, setSiteTitle]             = useState(content.siteTitle);
  const [loadingSubtitle, setLoadingSubtitle] = useState(content.loadingSubtitle);
  const [bootLines, setBootLines]             = useState<string[]>([...content.bootLines]);
  const [letterText, setLetterText]           = useState(content.letterText);
  const [reasons, setReasons]                 = useState<string[]>([...content.reasons]);
  const [songTitle, setSongTitle]             = useState(content.songTitle);
  const [songArtist, setSongArtist]           = useState(content.songArtist);
  const [songDuration, setSongDuration]       = useState(content.songDuration);
  const [cakeBlown, setCakeBlown]             = useState(content.cakeBlownMessage);
  const [cakeWish, setCakeWish]               = useState(content.cakeWishMessage);
  const [skyMessages, setSkyMessages]         = useState<string[]>([...content.skyMessages]);
  const [gifts, setGifts]                     = useState<Gift[]>([...content.gifts]);

  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { setAdmin(true); setError(""); }
    else { setError("Password salah."); setPassword(""); }
  };

  const handleSave = () => {
    updateContent({ siteTitle, loadingSubtitle, bootLines, letterText, reasons, songTitle, songArtist, songDuration, cakeBlownMessage: cakeBlown, cakeWishMessage: cakeWish, skyMessages, gifts });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setAudioLoading(true);
    try {
      const url = await saveAudioToIDB(file);
      setAudioObjectUrl(url, file.name);
    } catch {
      alert("Gagal memuat audio.");
    } finally {
      setAudioLoading(false);
    }
  };

  const handleVNUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setVnLoading(true);
    try {
      const label = vnLabel.trim() || `VN ${vnClips.length + 1}`;
      const { meta, url } = await saveVN(file, label);
      setVnClips(prev => [...prev, { meta, url }]);
      setVnLabel("");
    } catch {
      alert("Gagal upload voice note.");
    } finally {
      setVnLoading(false);
      if (vnInputRef.current) vnInputRef.current.value = "";
    }
  };

  const handleDeleteVN = async (id: string) => {
    await deleteVN(id);
    const a = vnAudioRefs.current[id];
    if (a) { a.pause(); delete vnAudioRefs.current[id]; }
    if (playingVnId === id) setPlayingVnId(null);
    setVnClips(prev => prev.filter(c => c.meta.id !== id));
  };

  const toggleVNPlay = (clip: VNClipAdmin) => {
    const id = clip.meta.id;
    if (!vnAudioRefs.current[id]) {
      const a = new Audio(clip.url);
      a.onended = () => setPlayingVnId(null);
      vnAudioRefs.current[id] = a;
    }
    if (playingVnId === id) {
      vnAudioRefs.current[id].pause();
      setPlayingVnId(null);
    } else {
      Object.entries(vnAudioRefs.current).forEach(([k, a]) => { if (k !== id) a.pause(); });
      setPlayingVnId(null);
      vnAudioRefs.current[id].play();
      setPlayingVnId(id);
    }
  };

  const addGift = () => {
    const pair = giftColorPairs[gifts.length % giftColorPairs.length];
    setGifts(prev => [...prev, { text: "Hadiah baru untukmu! 🎁", colorClass: pair.colorClass, bowClass: pair.bowClass }]);
  };

  const removeGift = (idx: number) => {
    if (gifts.length <= 1) { alert("Minimal harus ada 1 hadiah."); return; }
    setGifts(prev => prev.filter((_, i) => i !== idx));
  };

  const BASE = import.meta.env.BASE_URL;

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(255,240,248,0.82)", backdropFilter: "blur(20px)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#FFB6D9]/30 flex flex-col"
        style={{ maxHeight: "92vh" }}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FFB6D9]/20 bg-gradient-to-r from-[#FFF0F8] to-[#FFF8FC] flex-shrink-0">
          <div className="flex items-center gap-2">
            {isAdmin ? <Unlock className="w-4 h-4 text-[#D45A8F]" /> : <Lock className="w-4 h-4 text-[#D45A8F]" />}
            <h2 className="text-lg font-bold text-[#D45A8F]" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Panel Admin</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#FFB6D9]/20 transition-colors cursor-pointer">
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {!isAdmin ? (
          <div className="flex flex-col items-center justify-center gap-5 p-10 flex-1">
            <div className="text-5xl">🔐</div>
            <div className="text-center">
              <h3 className="text-xl font-bold mb-1 text-foreground">Masukkan Password</h3>
              <p className="text-foreground/55 text-sm">Hanya admin yang bisa mengubah konten</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="••••" autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-center text-3xl tracking-[0.6em] font-mono bg-white/80 text-foreground" />
              {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
              <button onClick={handleLogin}
                className="w-full py-3 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white font-bold rounded-xl transition-colors cursor-pointer shadow-md text-base">
                Masuk
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Section tabs */}
            <div className="flex overflow-x-auto gap-1 px-4 py-2 border-b border-[#FFB6D9]/15 bg-[#FFF8FC] no-scrollbar flex-shrink-0">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${activeSection === s.id ? "bg-[#FFB6D9] text-white shadow-sm" : "text-foreground/60 hover:text-foreground hover:bg-[#FFB6D9]/15"}`}>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div key={activeSection}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }} className="flex flex-col gap-3">

                  {/* ── JUDUL ── */}
                  {activeSection === "judul" && <>
                    <h3 className="text-base font-bold text-foreground">Judul / Nama Situs</h3>
                    <input value={siteTitle} onChange={e => setSiteTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-base bg-white/80 text-foreground font-medium" placeholder="BirthdayOS ♡" />
                  </>}

                  {/* ── LOADING ── */}
                  {activeSection === "loading" && <>
                    <h3 className="text-base font-bold text-foreground">Layar Loading & Boot</h3>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-foreground/65">Subtitle loading</label>
                      <input value={loadingSubtitle} onChange={e => setLoadingSubtitle(e.target.value)}
                        className="px-3 py-2.5 rounded-xl border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground" />
                    </div>
                    <div className="flex flex-col gap-2 mt-1">
                      <label className="text-xs font-semibold text-foreground/65">Baris terminal (boot screen)</label>
                      {bootLines.map((line, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[#D45A8F]/60 font-mono text-xs flex-shrink-0">›</span>
                          <input value={line} onChange={e => { const n=[...bootLines]; n[i]=e.target.value; setBootLines(n); }}
                            className="flex-1 px-3 py-2 rounded-lg border border-[#FFB6D9]/30 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 font-mono text-foreground" />
                          {bootLines.length > 1 && (
                            <button onClick={() => setBootLines(bootLines.filter((_,j)=>j!==i))} className="text-foreground/30 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setBootLines([...bootLines,"baris baru..."])}
                        className="flex items-center gap-1 self-start text-xs text-[#D45A8F] font-semibold hover:underline cursor-pointer mt-1">
                        <Plus className="w-3 h-3"/>Tambah baris
                      </button>
                    </div>
                  </>}

                  {/* ── FOTO PROFIL & COVER ── */}
                  {activeSection === "foto" && <>
                    <h3 className="text-base font-bold text-foreground">Foto Profil & Cover</h3>
                    <ImgUpload label="Foto Profil (Beranda & Navbar)" current={content.portraitImage} defaultSrc={`${BASE}chars/face-pink.jpg`}
                      onUpload={b64 => updateImages({ portraitImage: b64 })} />
                    <ImgUpload label="Cover Musik" current={content.coverImage} defaultSrc={`${BASE}chars/chef-seon.jpg`}
                      onUpload={b64 => updateImages({ coverImage: b64 })} />
                  </>}

                  {/* ── GALERI DINAMIS ── */}
                  {activeSection === "galeri" && <>
                    <h3 className="text-base font-bold text-foreground">Galeri Foto</h3>
                    <p className="text-xs text-foreground/55 font-medium">Tambah, edit, atau hapus foto galeri. {content.galleryItems.length} foto saat ini.</p>
                    <div className="flex flex-col gap-2">
                      {content.galleryItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-[#FFB6D9]/25 bg-white/70">
                          <img src={item.src || `${BASE}chars/face-pink.jpg`} alt=""
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-[#FFB6D9]/15" />
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <input value={item.caption}
                              onChange={e => { const n=[...content.galleryItems]; n[i]={...n[i],caption:e.target.value}; updateImages({galleryItems:n}); }}
                              className="w-full px-2 py-1 rounded-lg border border-[#FFB6D9]/25 focus:border-[#FFB6D9] outline-none text-xs bg-white/80 text-foreground font-medium"
                              placeholder="Caption..." />
                          </div>
                          <label className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FFB6D9]/80 hover:bg-[#D45A8F] text-white text-xs font-semibold rounded-lg cursor-pointer flex-shrink-0">
                            <Upload className="w-3 h-3"/>
                            <input type="file" accept="image/*" className="hidden" onChange={async e => {
                              const file=e.target.files?.[0]; if(!file)return;
                              try { const b64=await compressImage(file,800,0.78); const n=[...content.galleryItems]; n[i]={...n[i],src:b64}; updateImages({galleryItems:n}); } catch {}
                            }} />
                          </label>
                          <button onClick={() => { const n=content.galleryItems.filter((_,j)=>j!==i); updateImages({galleryItems:n}); }}
                            className="p-1.5 text-foreground/30 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => updateImages({ galleryItems:[...content.galleryItems,{src:"",caption:"momen indah"}] })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#FFB6D9]/40 text-[#D45A8F] text-sm font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer mt-1">
                      <Plus className="w-4 h-4"/>Tambah Foto
                    </button>
                  </>}

                  {/* ── KENANGAN DINAMIS ── */}
                  {activeSection === "kenangan" && <>
                    <h3 className="text-base font-bold text-foreground">Kenangan</h3>
                    <p className="text-xs text-foreground/55 font-medium">Edit, tambah, atau hapus kartu kenangan. {content.memoryCards.length} kenangan saat ini.</p>
                    <div className="flex flex-col gap-3">
                      {content.memoryCards.map((mem, i) => (
                        <div key={i} className="p-3 rounded-xl border border-[#FFB6D9]/25 bg-white/70 flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <label className="relative flex-shrink-0 cursor-pointer group">
                              <img src={mem.img || `${BASE}chars/face-yellow.jpg`} alt=""
                                className="w-16 h-16 object-cover rounded-xl border border-[#FFB6D9]/20 group-hover:opacity-80 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-4 h-4 text-white drop-shadow"/>
                              </div>
                              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                const file=e.target.files?.[0]; if(!file)return;
                                try { const b64=await compressImage(file,800,0.78); const n=[...content.memoryCards]; n[i]={...n[i],img:b64}; updateImages({memoryCards:n}); } catch {}
                              }} />
                            </label>
                            <div className="flex-1 flex flex-col gap-1.5">
                              <input value={mem.date} onChange={e=>{ const n=[...content.memoryCards] as MemoryCard[]; n[i]={...n[i],date:e.target.value}; updateImages({memoryCards:n}); }}
                                className="px-2 py-1 rounded-lg border border-[#FFB6D9]/25 focus:border-[#FFB6D9] outline-none text-xs bg-white/80 font-mono text-[#D45A8F] font-semibold" placeholder="Januari 2024" />
                              <input value={mem.title} onChange={e=>{ const n=[...content.memoryCards] as MemoryCard[]; n[i]={...n[i],title:e.target.value}; updateImages({memoryCards:n}); }}
                                className="px-2 py-1 rounded-lg border border-[#FFB6D9]/25 focus:border-[#FFB6D9] outline-none text-xs font-bold bg-white/80 text-foreground" placeholder="Judul kenangan..." />
                            </div>
                            <button onClick={() => { const n=content.memoryCards.filter((_,j)=>j!==i); updateImages({memoryCards:n}); }}
                              className="p-1.5 text-foreground/30 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                          <textarea value={mem.desc} onChange={e=>{ const n=[...content.memoryCards] as MemoryCard[]; n[i]={...n[i],desc:e.target.value}; updateImages({memoryCards:n}); }}
                            className="w-full px-2 py-1.5 rounded-lg border border-[#FFB6D9]/25 focus:border-[#FFB6D9] outline-none text-xs bg-white/80 resize-none leading-relaxed text-foreground" rows={2} placeholder="Cerita singkat..." />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => updateImages({ memoryCards:[...content.memoryCards,{date:"2024",title:"Kenangan Baru",desc:"Ceritakan momennya...",img:""}] })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#FFB6D9]/40 text-[#D45A8F] text-sm font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer mt-1">
                      <Plus className="w-4 h-4"/>Tambah Kenangan
                    </button>
                  </>}

                  {/* ── SURAT ── */}
                  {activeSection === "surat" && <>
                    <h3 className="text-base font-bold text-foreground">Teks Surat</h3>
                    <textarea value={letterText} onChange={e => setLetterText(e.target.value)}
                      className="w-full h-56 px-4 py-3 rounded-xl border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-sm leading-relaxed resize-none bg-white/80 font-serif text-foreground"
                      placeholder="Tulis surat di sini..." />
                  </>}

                  {/* ── ALASAN ── */}
                  {activeSection === "alasan" && <>
                    <h3 className="text-base font-bold text-foreground">100 Alasan</h3>
                    <p className="text-xs text-foreground/55 font-medium">Sudah terisi 100 alasan. Edit sesuai keinginanmu.</p>
                    <div className="flex flex-col gap-2">
                      {reasons.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[#D45A8F] font-bold text-xs w-7 flex-shrink-0 text-right">{i+1}.</span>
                          <input value={r} onChange={e => { const n=[...reasons]; n[i]=e.target.value; setReasons(n); }}
                            className="flex-1 px-3 py-2 rounded-lg border border-[#FFB6D9]/30 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground" />
                        </div>
                      ))}
                    </div>
                  </>}

                  {/* ── LAGU ── */}
                  {activeSection === "lagu" && <>
                    <h3 className="text-base font-bold text-foreground">Info Lagu & Audio</h3>
                    <div className="p-4 rounded-xl border-2 border-dashed border-[#FFB6D9]/40 bg-[#FFF8FC] flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-[#D45A8F]"/>
                        <span className="text-sm font-bold text-[#D45A8F]">Upload Audio atau Video</span>
                      </div>
                      {content.audioObjectUrl ? (
                        <div>
                          <p className="text-xs text-green-600 font-semibold">✓ {content.audioFileName || "Audio aktif"}</p>
                          <p className="text-xs text-green-600/70 mt-0.5">Tersimpan permanen — tidak akan hilang saat refresh ✓</p>
                        </div>
                      ) : (
                        <p className="text-xs text-foreground/55 font-medium">MP3, WAV, M4A — atau video MP4/MOV, audio akan diekstrak otomatis 🎵</p>
                      )}
                      <input ref={audioInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleAudioUpload} />
                      <button onClick={() => audioInputRef.current?.click()} disabled={audioLoading}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60">
                        <Upload className="w-3.5 h-3.5"/>{audioLoading ? "Menyimpan..." : "Pilih Audio / Video"}
                      </button>
                    </div>
                    {[
                      { label:"Judul Lagu", value:songTitle, set:setSongTitle },
                      { label:"Artis / Subtitle", value:songArtist, set:setSongArtist },
                      { label:"Durasi (misal: 3:47)", value:songDuration, set:setSongDuration },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-foreground/65">{f.label}</label>
                        <input value={f.value} onChange={e => f.set(e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground font-medium" />
                      </div>
                    ))}
                  </>}

                  {/* ── SUARA / VN ── */}
                  {activeSection === "suara" && <>
                    <h3 className="text-base font-bold text-foreground">Voice Note (VN)</h3>
                    <p className="text-xs text-foreground/55 font-medium">
                      Upload rekaman suara khusus. Setiap VN bisa diberi nama dan dimainkan oleh penerima satu per satu.
                    </p>
                    <div className="p-4 rounded-xl border-2 border-dashed border-[#FFB6D9]/40 bg-[#FFF8FC] flex flex-col gap-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Mic className="w-4 h-4 text-[#D45A8F]" />
                        <span className="text-sm font-bold text-[#D45A8F]">Upload Voice Note Baru</span>
                      </div>
                      <input value={vnLabel} onChange={e => setVnLabel(e.target.value)}
                        placeholder='Nama VN, misal: "Selamat Ultah ♡"'
                        className="px-3 py-2 rounded-lg border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground font-medium" />
                      <p className="text-xs text-foreground/45">Pilih file audio (MP3, WAV, M4A, dll)</p>
                      <input ref={vnInputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleVNUpload} />
                      <button onClick={() => vnInputRef.current?.click()} disabled={vnLoading}
                        className="self-start flex items-center gap-2 px-4 py-2 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60">
                        <Upload className="w-3.5 h-3.5" />{vnLoading ? "Menyimpan..." : "Pilih File Audio"}
                      </button>
                    </div>
                    {vnClips.length === 0 ? (
                      <p className="text-xs text-foreground/40 text-center py-4">Belum ada voice note. Upload di atas.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-semibold text-foreground/60">{vnClips.length} voice note tersimpan:</p>
                        {vnClips.map((clip, i) => (
                          <div key={clip.meta.id} className="flex items-center gap-2 p-3 rounded-xl border border-[#FFB6D9]/25 bg-white/70">
                            <div className="w-8 h-8 rounded-full bg-[#FFB6D9]/20 flex items-center justify-center flex-shrink-0 border border-[#FFB6D9]/30">
                              <span className="text-sm">🎤</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{clip.meta.label || `VN ${i + 1}`}</p>
                              <p className="text-xs text-foreground/40 truncate">{clip.meta.fileName}</p>
                            </div>
                            <button onClick={() => toggleVNPlay(clip)}
                              className="p-2 rounded-full bg-[#FFB6D9]/20 hover:bg-[#FFB6D9]/40 transition-colors cursor-pointer flex-shrink-0">
                              {playingVnId === clip.meta.id
                                ? <Pause className="w-3.5 h-3.5 text-[#D45A8F]" />
                                : <Play className="w-3.5 h-3.5 text-[#D45A8F] fill-[#D45A8F]" />}
                            </button>
                            <button onClick={() => { if (confirm(`Hapus "${clip.meta.label}"?`)) handleDeleteVN(clip.meta.id); }}
                              className="p-2 text-foreground/30 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>}

                  {/* ── LILIN ── */}
                  {activeSection === "lilin" && <>
                    <h3 className="text-base font-bold text-foreground">Pesan Tiup Lilin</h3>
                    {[
                      { label:"Judul setelah tiup", value:cakeBlown, set:setCakeBlown },
                      { label:"Keterangan bawah", value:cakeWish, set:setCakeWish },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-foreground/65">{f.label}</label>
                        <input value={f.value} onChange={e => f.set(e.target.value)}
                          className="px-3 py-2.5 rounded-xl border border-[#FFB6D9]/40 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground font-medium" />
                      </div>
                    ))}
                  </>}

                  {/* ── BINTANG ── */}
                  {activeSection === "bintang" && <>
                    <h3 className="text-base font-bold text-foreground">Pesan Bintang</h3>
                    {skyMessages.map((msg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[#D45A8F] text-xs">✦</span>
                        <input value={msg} onChange={e => { const n=[...skyMessages]; n[i]=e.target.value; setSkyMessages(n); }}
                          className="flex-1 px-3 py-2 rounded-lg border border-[#FFB6D9]/30 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground" />
                        {skyMessages.length > 1 && (
                          <button onClick={() => setSkyMessages(skyMessages.filter((_,j)=>j!==i))} className="text-foreground/30 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5"/></button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => setSkyMessages([...skyMessages,"Pesan baru..."])}
                      className="flex items-center gap-1 self-start text-xs text-[#D45A8F] font-semibold hover:underline cursor-pointer">
                      <Plus className="w-3 h-3"/>Tambah
                    </button>
                  </>}

                  {/* ── HADIAH ── */}
                  {activeSection === "hadiah" && <>
                    <h3 className="text-base font-bold text-foreground">Daftar Hadiah</h3>
                    <p className="text-xs text-foreground/55 font-medium">
                      {gifts.length} hadiah saat ini. Tambah atau hapus sesukamu — setiap hadiah punya warna otomatis.
                    </p>

                    <div className="flex flex-col gap-2">
                      {gifts.map((g, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#FFB6D9]/25 bg-white/70">
                          {/* Color preview */}
                          <div className={`w-10 h-10 rounded-xl flex-shrink-0 ${g.colorClass} border border-[#FFB6D9]/30 relative overflow-hidden shadow-sm`}>
                            <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-2 ${g.bowClass} opacity-70`} />
                            <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 ${g.bowClass} opacity-70`} />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">Hadiah {i + 1}</label>
                            <input
                              value={g.text}
                              onChange={e => {
                                const n = [...gifts];
                                n[i] = { ...n[i], text: e.target.value };
                                setGifts(n);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#FFB6D9]/30 focus:border-[#FFB6D9] outline-none text-sm bg-white/80 text-foreground font-medium"
                              placeholder="Tulis pesan hadiah..."
                            />
                          </div>
                          <button
                            onClick={() => removeGift(i)}
                            className="p-1.5 text-foreground/30 hover:text-red-400 cursor-pointer rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addGift}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[#FFB6D9]/40 text-[#D45A8F] text-sm font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer mt-1"
                    >
                      <Plus className="w-4 h-4" />Tambah Hadiah
                    </button>

                    <p className="text-xs text-foreground/40 text-center mt-1">
                      Jangan lupa tekan Simpan setelah selesai edit ↓
                    </p>
                  </>}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#FFB6D9]/15 flex gap-3 flex-shrink-0 bg-[#FFF8FC]">
              <button onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#FFB6D9] hover:bg-[#D45A8F] text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-sm">
                <Save className="w-4 h-4"/>{saved ? "Tersimpan! ✓" : "Simpan"}
              </button>
              <button onClick={() => { if (confirm("Reset semua ke default?")) { resetContent(); onClose(); } }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-foreground/45 hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer rounded-xl hover:bg-red-50">
                <RotateCcw className="w-3.5 h-3.5"/>Reset
              </button>
            </div>
          </div>
        )}
      </motion.div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </motion.div>
  );
}
