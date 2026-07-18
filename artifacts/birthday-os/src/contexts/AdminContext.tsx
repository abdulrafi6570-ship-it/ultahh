import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { loadAudioFromIDB, clearAudioFromIDB } from "@/lib/audioStorage";

export interface MemoryCard {
  date: string;
  title: string;
  desc: string;
  img: string; // base64 or ""
}

export interface Gift {
  text: string;
  colorClass: string;
  bowClass: string;
}

export interface AdminContent {
  siteTitle: string;
  loadingSubtitle: string;
  bootLines: string[];
  letterText: string;
  reasons: string[];
  songTitle: string;
  songArtist: string;
  songDuration: string;
  cakeBlownMessage: string;
  cakeWishMessage: string;
  skyMessages: string[];
  // Dynamic gifts
  gifts: Gift[];
  // Images
  portraitImage: string;
  coverImage: string;
  // Dynamic gallery: array of { src, caption }
  galleryItems: { src: string; caption: string }[];
  // Dynamic memories
  memoryCards: MemoryCard[];
  // Audio — stored in IndexedDB, restored as object URL on load
  audioObjectUrl: string;
  audioFileName: string;
}

const STORAGE_KEY = "birthdayos_admin_v6";
const IMG_STORAGE_KEY = "birthdayos_images_v5";

const all100Reasons: string[] = [
  "Karena kamu selalu ada saat dibutuhkan",
  "Karena tawamu bisa menerangi hari yang paling gelap sekalipun",
  "Karena kamu tidak pernah menghakimi siapapun",
  "Karena kamu selalu berusaha menjadi versi terbaik dirimu",
  "Karena kamu peduli dengan hal-hal kecil yang sering orang lupakan",
  "Karena ketulusanmu terasa nyata dan hangat",
  "Karena kamu berani bermimpi besar",
  "Karena cara kamu tertawa itu sangat menular",
  "Karena kamu tahu kapan seseorang butuh dipeluk",
  "Karena kamu tidak pernah menyerah meski situasinya sulit",
  "Karena kamu membuat orang-orang di sekitarmu merasa berharga",
  "Karena kamu selalu mau belajar hal baru",
  "Karena kamu jujur bahkan ketika kejujuran itu berat",
  "Karena kamu ingat hal-hal kecil yang berarti bagi orang lain",
  "Karena senyummu bisa mengubah suasana ruangan",
  "Karena kamu tidak takut untuk tampil apa adanya",
  "Karena kamu mau mendengarkan dengan sepenuh hati",
  "Karena kamu selalu punya kata-kata yang tepat di saat yang tepat",
  "Karena kamu kuat, bahkan ketika kamu sendiri tidak menyadarinya",
  "Karena kamu tidak berhenti peduli meski lelah",
  "Karena kamu tahu cara membuat orang merasa di rumah",
  "Karena semangat hidupmu itu menginspirasi",
  "Karena kamu tidak pernah berhenti berjuang untuk yang kamu cintai",
  "Karena caramu melihat dunia itu indah dan unik",
  "Karena kamu mau meluangkan waktu untuk orang lain",
  "Karena kamu tulus dalam setiap hal yang kamu lakukan",
  "Karena kamu bisa membuat hal sederhana terasa luar biasa",
  "Karena kamu tidak membutuhkan validasi untuk percaya pada dirimu",
  "Karena kehadiranmu itu selalu menenangkan",
  "Karena kamu berani mengambil risiko demi sesuatu yang kamu percaya",
  "Karena kamu selalu menemukan cara untuk tersenyum",
  "Karena kamu tidak membeda-bedakan orang",
  "Karena kamu tahu cara menikmati momen kecil",
  "Karena matamu menyimpan banyak cerita yang belum terungkap",
  "Karena kamu selalu mencoba memahami sebelum menghakimi",
  "Karena kamu punya kepekaan yang luar biasa terhadap perasaan orang",
  "Karena caramu bicara itu selalu penuh perhatian",
  "Karena kamu mau berubah dan tumbuh setiap hari",
  "Karena kamu tahu bahwa hal-hal besar dimulai dari yang kecil",
  "Karena kamu tidak pernah membuat orang merasa sendirian",
  "Karena kamu selalu mau mengakui kesalahan dengan lapang dada",
  "Karena kamu memiliki ketangguhan yang sunyi tapi nyata",
  "Karena caramu mencintai itu dalam dan sungguh-sungguh",
  "Karena kamu tahu cara menjaga kepercayaan",
  "Karena kamu selalu punya energi untuk mendukung orang lain",
  "Karena kamu percaya bahwa setiap orang punya potensi",
  "Karena kamu tidak menyimpan dendam",
  "Karena kamu berani bilang maaf duluan",
  "Karena caramu menyayangi itu terasa tulus tanpa syarat",
  "Karena kamu tahu kapan harus diam dan kapan harus bicara",
  "Karena kamu tidak pernah berhenti bersyukur",
  "Karena kamu selalu mencari sisi baik dari setiap situasi",
  "Karena kamu punya keberanian yang tidak semua orang miliki",
  "Karena kamu membuat hal-hal biasa terasa istimewa",
  "Karena kesabaranmu itu luar biasa",
  "Karena kamu selalu berusaha mengerti perspektif orang lain",
  "Karena kamu tidak pernah menyerah pada mimpi-mimpimu",
  "Karena kamu tahu cara membuat orang tertawa di saat yang paling tepat",
  "Karena dedikasi dan semangatmu selalu menginspirasi",
  "Karena kamu percaya pada kebaikan di setiap orang",
  "Karena kamu selalu hadir dengan sepenuh hati",
  "Karena kamu membawa kehangatan ke mana pun kamu pergi",
  "Karena kamu tidak takut menunjukkan kerentananmu",
  "Karena kamu selalu mau berusaha lebih keras",
  "Karena caramu merawat orang-orang di sekitarmu itu indah",
  "Karena kamu selalu menghargai waktu yang kamu habiskan bersama orang lain",
  "Karena kepribadianmu yang otentik selalu menyegarkan",
  "Karena kamu tahu cara membuat orang merasa dilihat dan didengar",
  "Karena semangatmu tidak pernah padam meski dihadang rintangan",
  "Karena kamu selalu mau berdiri untuk hal yang benar",
  "Karena kamu tidak takut berbeda dari yang lain",
  "Karena kamu selalu ingat untuk merayakan keberhasilan kecil",
  "Karena kamu membuat dunia menjadi tempat yang lebih hangat",
  "Karena jiwa petualangmu yang terus mencari pengalaman baru",
  "Karena kamu selalu punya ide-ide segar yang menginspirasi",
  "Karena kamu tidak membiarkan ketakutan menghentikanmu",
  "Karena cara kamu menjaga persahabatan itu tulus",
  "Karena kamu selalu mau berbagi dan memberi",
  "Karena kamu tidak pernah kehilangan rasa ingin tahumu",
  "Karena kamu memiliki hati yang begitu hangat dan terbuka",
  "Karena kamu percaya bahwa setiap hari adalah kesempatan baru",
  "Karena kamu tidak pernah meremehkan perasaan orang lain",
  "Karena kamu selalu menemukan cara untuk membuat segalanya lebih baik",
  "Karena kehadiranmu selalu membawa ketenangan",
  "Karena kamu tahu cara bersyukur atas hal-hal kecil",
  "Karena kamu selalu berusaha menjadi teman yang baik",
  "Karena kamu tidak pernah kehilangan kepercayaan pada dirimu",
  "Karena caramu menikmati hidup itu menginspirasi",
  "Karena kamu selalu memperhatikan detail-detail yang sering terlewatkan",
  "Karena kamu tahu cara menghibur diri dan orang lain",
  "Karena kamu tidak pernah berhenti berharap",
  "Karena kamu membuat setiap momen menjadi berarti",
  "Karena kamu selalu menemukan cara untuk tumbuh dari setiap pengalaman",
  "Karena kamu tidak pernah takut untuk bermimpi lebih tinggi",
  "Karena kamu selalu hadir untuk orang-orang yang kamu sayangi",
  "Karena cara kamu menghadapi hidup dengan penuh semangat itu luar biasa",
  "Karena kamu adalah dirimu sendiri, dan itu lebih dari cukup",
];

const defaultGifts: Gift[] = [
  { text: "Semoga hidupmu selalu penuh warna dan kebahagiaan 🌸", colorClass: "bg-[#FFB6D9]", bowClass: "bg-white" },
  { text: "Kamu layak mendapatkan semua yang indah di dunia ini ✨", colorClass: "bg-[#E8F4FF]", bowClass: "bg-[#FFB6D9]" },
  { text: "Hadirmu membuat hari-hari menjadi lebih berarti 💜", colorClass: "bg-[#D8B4E2]", bowClass: "bg-[#E8F4FF]" },
  { text: "Teruslah bersinar, dunia lebih cerah karena kamu 🌟", colorClass: "bg-white", bowClass: "bg-[#D8B4E2]" },
  { text: "Selamat ulang tahun! Semoga tahun ini penuh kejutan indah 🎉", colorClass: "bg-[#FFE0B2]", bowClass: "bg-[#FFB6D9]" },
];

const defaultGalleryItems = [
  { src: "", caption: "Momen indah bersama 🌸" },
  { src: "", caption: "Kenangan yang tak terlupakan ✨" },
  { src: "", caption: "Hari-hari terbaik kita 💕" },
];

const defaultMemoryCards = [
  { date: "Januari 2024", title: "Awal yang Indah", desc: "Cerita tentang momen pertama kita...", img: "" },
  { date: "Maret 2024",   title: "Perjalanan Bersama", desc: "Kenangan perjalanan yang tak terlupakan...", img: "" },
  { date: "Juni 2024",    title: "Tawa dan Canda",  desc: "Hari-hari penuh kebahagiaan bersama...", img: "" },
];

const defaultContent: AdminContent = {
  siteTitle: "BirthdayOS ♡",
  loadingSubtitle: "mempersiapkan kejutan untukmu...",
  bootLines: [
    "loading birthday.exe...",
    "initializing love protocols...",
    "mounting memory banks...",
    "compiling 365 days of you...",
    "applying pink theme...",
    "birthday OS ready ✓",
  ],
  letterText: `Hai kamu yang luar biasa,\n\nSelamat ulang tahun! Hari ini adalah hari yang sangat spesial karena kamu ada di dunia ini.\n\nSemoga semua impianmu menjadi kenyataan, dan semoga tahun ini membawa banyak kebahagiaan, cinta, dan petualangan baru.\n\nDengan sepenuh hati ♡`,
  reasons: all100Reasons,
  songTitle: "Lagu Untukmu",
  songArtist: "Khusus di hari spesialmu",
  songDuration: "3:47",
  cakeBlownMessage: "Semua lilin padam! 🎉",
  cakeWishMessage: "Keinginanmu sudah tersampaikan ke bintang-bintang ✨",
  skyMessages: [
    "Kamu adalah cahaya di hari-hariku 🌟",
    "Semoga tahun ini lebih indah dari sebelumnya",
    "Terima kasih sudah hadir dalam hidupku ♡",
    "Kamu luar biasa, jangan pernah lupa itu",
    "Wish made just for you ✨",
  ],
  gifts: defaultGifts,
  portraitImage: "",
  coverImage: "",
  galleryItems: defaultGalleryItems,
  memoryCards: defaultMemoryCards,
  audioObjectUrl: "",
  audioFileName: "",
};

function loadContent(): AdminContent {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const imgSaved = localStorage.getItem(IMG_STORAGE_KEY);
    const text = saved ? JSON.parse(saved) : {};
    const imgs = imgSaved ? JSON.parse(imgSaved) : {};
    return {
      ...defaultContent,
      ...text,
      portraitImage: imgs.portraitImage || "",
      coverImage: imgs.coverImage || "",
      galleryItems: imgs.galleryItems || defaultGalleryItems,
      memoryCards: imgs.memoryCards || defaultMemoryCards,
      audioObjectUrl: "",
      audioFileName: text.audioFileName || "",
      gifts: text.gifts || defaultGifts,
    };
  } catch {
    return { ...defaultContent };
  }
}

interface AdminContextValue {
  content: AdminContent;
  isAdmin: boolean;
  setAdmin: (v: boolean) => void;
  updateContent: (patch: Partial<Omit<AdminContent, "portraitImage" | "coverImage" | "galleryItems" | "memoryCards" | "audioObjectUrl" | "audioFileName">>) => void;
  updateImages: (patch: Partial<Pick<AdminContent, "portraitImage" | "coverImage" | "galleryItems" | "memoryCards">>) => void;
  setAudioObjectUrl: (url: string, fileName?: string) => void;
  resetContent: () => void;
}

const AdminContext = createContext<AdminContextValue>({
  content: defaultContent,
  isAdmin: false,
  setAdmin: () => {},
  updateContent: () => {},
  updateImages: () => {},
  setAudioObjectUrl: () => {},
  resetContent: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<AdminContent>(loadContent);
  const [isAdmin, setAdmin] = useState(false);

  useEffect(() => {
    loadAudioFromIDB().then(result => {
      if (result) {
        setContent(prev => ({ ...prev, audioObjectUrl: result.url, audioFileName: result.name }));
      }
    });
  }, []);

  const updateContent = useCallback((patch: Partial<Omit<AdminContent, "portraitImage" | "coverImage" | "galleryItems" | "memoryCards" | "audioObjectUrl" | "audioFileName">>) => {
    setContent(prev => {
      const next = { ...prev, ...patch };
      const { portraitImage, coverImage, galleryItems, memoryCards, audioObjectUrl, audioFileName, ...rest } = next;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rest)); } catch {}
      return next;
    });
  }, []);

  const updateImages = useCallback((patch: Partial<Pick<AdminContent, "portraitImage" | "coverImage" | "galleryItems" | "memoryCards">>) => {
    setContent(prev => {
      const next = { ...prev, ...patch };
      const imgData = { portraitImage: next.portraitImage, coverImage: next.coverImage, galleryItems: next.galleryItems, memoryCards: next.memoryCards };
      try { localStorage.setItem(IMG_STORAGE_KEY, JSON.stringify(imgData)); } catch (e) {
        console.warn("Storage penuh – gambar tidak tersimpan:", e);
      }
      return next;
    });
  }, []);

  const setAudioObjectUrl = useCallback((url: string, fileName?: string) => {
    setContent(prev => ({ ...prev, audioObjectUrl: url, audioFileName: fileName || prev.audioFileName }));
  }, []);

  const resetContent = useCallback(() => {
    setContent({ ...defaultContent, portraitImage: "", coverImage: "", galleryItems: defaultGalleryItems, memoryCards: defaultMemoryCards, audioObjectUrl: "", audioFileName: "" });
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(IMG_STORAGE_KEY); } catch {}
    clearAudioFromIDB();
  }, []);

  return (
    <AdminContext.Provider value={{ content, isAdmin, setAdmin, updateContent, updateImages, setAudioObjectUrl, resetContent }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() { return useContext(AdminContext); }
