import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const { content } = useAdmin();
  const lines = content.bootLines;

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setCurrentLineIndex(0);
    setDisplayedText("");
    setIsDone(false);
  }, [lines]);

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      setTimeout(() => setIsDone(true), 1000);
      return;
    }
    const currentLine = lines[currentLineIndex];
    let charIndex = 0;
    let isMounted = true;
    const typeChar = () => {
      if (!isMounted) return;
      if (charIndex <= currentLine.length) {
        setDisplayedText(currentLine.slice(0, charIndex));
        charIndex++;
        setTimeout(typeChar, 35 + Math.random() * 35);
      } else {
        setTimeout(() => {
          if (isMounted) { setCurrentLineIndex(p => p + 1); setDisplayedText(""); }
        }, 500);
      }
    };
    typeChar();
    return () => { isMounted = false; };
  }, [currentLineIndex, lines]);

  useEffect(() => { if (isDone) onComplete(); }, [isDone, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col p-12 font-mono"
      style={{ background: "linear-gradient(160deg, #0a0012 0%, #1a0020 50%, #0d000d 100%)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div
        className="absolute bottom-0 inset-x-0 h-64 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,182,217,0.1) 0%, transparent 70%)" }}
      />
      <div className="flex flex-col gap-3 mt-auto mb-auto">
        {lines.slice(0, currentLineIndex).map((line, i) => (
          <motion.div
            key={i}
            className="text-base"
            style={{ color: i === lines.length - 1 ? "#FFB6D9" : "rgba(255,182,217,0.6)" }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <span style={{ color: "rgba(255,182,217,0.3)" }}>› </span>{line}
          </motion.div>
        ))}
        {currentLineIndex < lines.length && (
          <motion.div
            className="text-base"
            style={{ color: "rgba(255,182,217,0.6)" }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span style={{ color: "rgba(255,182,217,0.3)" }}>› </span>
            {displayedText}
            <motion.span
              style={{ color: "#FFB6D9" }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
            >_</motion.span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
