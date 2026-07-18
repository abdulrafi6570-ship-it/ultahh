import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";

export default function GalleryApp() {
  const { content } = useAdmin();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const BASE = import.meta.env.BASE_URL;

  const items = content.galleryItems;
  const defaultImgs = Array.from({ length: 8 }, (_, i) => `${BASE}images/gallery-${i + 1}.png`);

  return (
    <div className="w-full min-h-[calc(100vh-6rem)] flex flex-col pb-6 relative">
      {/* Background glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB6D9]/15 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#E8F4FF]/20 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="px-5 pt-5 pb-3 relative z-10 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
            Galeri
          </h1>
          <p className="text-foreground/50 text-sm mt-0.5">{items.length} foto spesial 📷</p>
        </div>
        {/* Camera sticker */}
        <motion.img
          src={`${BASE}deco/camera.png`} alt=""
          className="w-20 object-contain select-none"
          animate={{ rotate: [-4, 3, -4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
      </div>

      {/* Cat sticker — floating */}
      <motion.img
        src={`${BASE}deco/cat-cam.png`} alt=""
        className="absolute top-20 right-2 w-20 select-none pointer-events-none z-20"
        animate={{ y: [0, -5, 0], rotate: [0, 2, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
      />

      {/* Photo strip decoration */}
      <motion.img
        src={`${BASE}deco/photostrip.png`} alt=""
        className="absolute bottom-24 right-2 w-16 object-contain select-none pointer-events-none z-10 opacity-70"
        animate={{ rotate: [3, -1, 3] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      />

      {/* Masonry grid */}
      <div className="px-4 relative z-10">
        <div className="columns-2 gap-3">
          {items.map((item, i) => {
            const src = item.src || defaultImgs[i % 8];
            return (
              <motion.div
                key={i}
                className="break-inside-avoid mb-3 relative group cursor-pointer overflow-hidden rounded-xl border border-[#FFB6D9]/20 shadow-md bg-white/60"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedIdx(i)}
                whileHover={{ scale: 1.02 }}
              >
                <div className="rounded-xl overflow-hidden relative">
                  <img src={src} alt={item.caption} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {item.caption && (
                  <div className="px-2.5 py-1.5">
                    <p className="text-xs font-medium text-foreground/60 truncate">{item.caption}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedIdx(null)}
          >
            <motion.div
              className="relative max-w-sm w-full"
              initial={{ scale: 0.88, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", damping: 22 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer" onClick={() => setSelectedIdx(null)}>
                <X className="w-4 h-4" />
              </button>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer"
                onClick={() => setSelectedIdx(i => i !== null ? Math.max(0, i - 1) : null)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur rounded-full text-white z-50 cursor-pointer"
                onClick={() => setSelectedIdx(i => i !== null ? Math.min(items.length - 1, i + 1) : null)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <img
                  src={items[selectedIdx].src || defaultImgs[selectedIdx % 8]}
                  alt={items[selectedIdx].caption}
                  className="w-full h-auto max-h-[70vh] object-contain bg-black"
                />
                {items[selectedIdx].caption && (
                  <div className="bg-black/70 px-4 py-2 text-center">
                    <p className="text-white/80 text-sm font-medium italic">{items[selectedIdx].caption}</p>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 pointer-events-none">
                <img src={`${import.meta.env.BASE_URL}deco/cat-cam.png`} alt="" className="w-14 object-contain" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
