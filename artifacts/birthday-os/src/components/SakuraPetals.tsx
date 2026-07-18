import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SakuraPetals() {
  const [petals, setPetals] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const newPetals = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {petals.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute top-[-5%] w-3 h-3 bg-[#FFB6D9] rounded-[50%_0_50%_50%] opacity-60"
          style={{ left: `${petal.left}%` }}
          animate={{
            y: ["0vh", "110vh"],
            x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 100],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}