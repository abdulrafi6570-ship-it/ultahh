import sys

path = "artifacts/birthday-os/src/pages/LetterApp.tsx"
with open(path, "r", encoding="utf-8") as f:
    src = f.read()

old1 = 'import { useState } from "react";'
new1 = 'import { useState, useRef, useEffect } from "react";'

old2 = '''  const { displayedText } = useTypewriter(isOpen && activeTab === "surat" ? content.letterText : "", 30, 600);'''
new2 = '''  const { displayedText } = useTypewriter(isOpen && activeTab === "surat" ? content.letterText : "", 30, 600);
  const letterScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = letterScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [displayedText]);'''

old3 = '''                    className="w-full max-h-[75vh] bg-[#FDFBF7] rounded-2xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,182,217,0.15)] overflow-y-auto border border-[#FFB6D9]/20"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", damping: 25 }}
                  >'''
new3 = '''                    ref={letterScrollRef}
                    className="w-full max-h-[75vh] bg-[#FDFBF7] rounded-2xl p-8 md:p-12 shadow-[0_0_50px_rgba(255,182,217,0.15)] overflow-y-auto border border-[#FFB6D9]/20 scroll-smooth"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", damping: 25 }}
                  >'''

for old, new, label in [(old1, new1, "import"), (old2, new2, "ref+effect"), (old3, new3, "ref attach")]:
    if old not in src:
        print(f"PATCH GAGAL di bagian: {label}")
        sys.exit(1)
    src = src.replace(old, new, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(src)

print("PATCH BERHASIL diterapkan ke " + path)
