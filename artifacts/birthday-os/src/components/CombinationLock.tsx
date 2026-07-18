/**
 * CombinationLock — 4-dial scroll lock inspired by Uiverse.io/dexter-st
 * Each dial shows digits 0–9 on a 10-faced polygon, scrollable via radio buttons.
 * Calls onMatch(pin) when the current 4-digit combo matches any of the target pins.
 */
import { useState } from "react";

const STYLE = `
.combo-lock-wrap {
  position: relative;
  display: flex;
  gap: 1.075rem;
  user-select: none;
  isolation: isolate;
}

.combo-lock-wrap .dial {
  width: 40px;
  height: 120px;
  overflow: hidden;
  perspective: 500px;
  border-radius: 10px / 250px;
  outline: solid 3px #000;
  outline-offset: 1px;
  filter: drop-shadow(4px 0 0px #0006) drop-shadow(8px -1px 1px #0003)
    drop-shadow(8px 10px 1px #0003)
    drop-shadow(12px 16px 30px rgba(177,175,174,0.1))
    drop-shadow(-12px -16px 36px rgba(255,255,255,0.1)) contrast(1.5) sepia(0.2);
  box-shadow: -2px -3px 0 4px #1115, 0 -3px 0 2px #fff, 0 2px 0 3px #eee, 0 4px 0 4px #0009;
}

.combo-lock-wrap .dial::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle at 50% 50%, #000 40%, 40.5%, #fff0),
    linear-gradient(to bottom, #fff, 50%, #111);
  background-position: 0 16px, 0 0;
  background-repeat: no-repeat;
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.combo-lock-wrap .nonagon {
  width: 100%;
  height: 100%;
  position: relative;
  top: 36px;
  transform-style: preserve-3d;
  transform-origin: 0 24px;
  transition: transform 300ms ease;
}

.combo-lock-wrap .face {
  position: absolute;
  display: grid;
  place-items: center;
  width: 40px;
  height: 47px;
  background-color: #c4c2bd;
  box-shadow: 0 -3px 1px 2px #000a, 0 0px 1px 3px #fffa;
  font-family: "Lucida Console", Courier, monospace;
  font-size: 1.75em;
  font-weight: bold;
  text-shadow: 1px 1px 0.5px #fff, -1px -1px 0.5px #ccc, -0.5px -0.5px 0.5px #0005;
  color: rgba(65,58,36,0.9);
}

.combo-lock-wrap .face::before,
.combo-lock-wrap .face::after {
  content: "";
  position: absolute;
  height: 100%;
  width: 4px;
  border: 0.5px solid #0005;
}
.combo-lock-wrap .face::before { left: 0; background-color: #fff; }
.combo-lock-wrap .face::after  { right: 0; background-color: #0004; }

.combo-lock-wrap .face span {
  position: absolute;
  pointer-events: none;
}

.combo-lock-wrap .face .radio {
  position: absolute;
  width: 100%;
  height: 100%;
  cursor: pointer;
  appearance: none;
  opacity: 0;
  z-index: 1;
}

.combo-lock-wrap .face-0 { transform: rotateX(0deg)    translateZ(71px); }
.combo-lock-wrap .face-1 { transform: rotateX(-36deg)  translateZ(71px); }
.combo-lock-wrap .face-2 { transform: rotateX(-72deg)  translateZ(71px); }
.combo-lock-wrap .face-3 { transform: rotateX(-108deg) translateZ(71px); }
.combo-lock-wrap .face-4 { transform: rotateX(-144deg) translateZ(71px); }
.combo-lock-wrap .face-5 { transform: rotateX(-180deg) translateZ(71px); }
.combo-lock-wrap .face-6 { transform: rotateX(-216deg) translateZ(71px); }
.combo-lock-wrap .face-7 { transform: rotateX(-252deg) translateZ(71px); }
.combo-lock-wrap .face-8 { transform: rotateX(-288deg) translateZ(71px); }
.combo-lock-wrap .face-9 { transform: rotateX(-324deg) translateZ(71px); }

.combo-lock-wrap .combo-light {
  position: absolute;
  left: 50%;
  width: 16px;
  height: 16px;
  bottom: -36px;
  transform: translateX(-8px);
  color: rgb(248, 60, 40);
  background-color: currentColor;
  background-image: radial-gradient(circle at 50% 40%, #fff6 1px, currentColor);
  border-radius: 50%;
  border: 3px dotted #fff5;
  outline: 3px solid #0003;
  transition: background-color 400ms ease, color 400ms ease;
  box-shadow:
    1px 1px 2px 1px #0005 inset,
    -1px -1px 2px 1px #0005 inset,
    0 0 2px 1px currentColor,
    0 0 16px 0px currentColor,
    0 0 24px 3px currentColor,
    0 0 48px 8px rgba(255,231,201,1);
  filter: drop-shadow(2px 0 0px #0006) drop-shadow(3px 6px 1px #0004)
    drop-shadow(12px 16px 32px rgba(255,231,201,0.5))
    drop-shadow(-12px -16px 64px rgba(255,231,201,0.5)) contrast(1.1) brightness(1.3);
}

.combo-lock-wrap .combo-light.green {
  color: rgb(150, 255, 179);
}

.combo-lock-wrap .combo-arrow {
  position: absolute;
  width: 0;
  height: 0;
  filter: drop-shadow(0 0 4px #0009);
  top: calc(50% - 14px);
  z-index: -1;
}
.combo-lock-wrap .combo-arrow.left {
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 12px solid rgba(255,91,72,0.6);
  left: -26px;
}
.combo-lock-wrap .combo-arrow.right {
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-right: 12px solid rgba(255,91,72,0.6);
  right: -26px;
}
`;

// Map digit → rotateX angle
const DIGIT_TO_ANGLE: Record<number, number> = {
  0: 0, 1: 36, 2: 72, 3: 108, 4: 144,
  5: 180, 6: 216, 7: 252, 8: 288, 9: 324,
};

interface CombinationLockProps {
  /** 4-character numeric pin string, e.g. "0808" */
  targetPin: string;
  /** Called when the dialed combination matches the target pin */
  onMatch: () => void;
}

export default function CombinationLock({ targetPin, onMatch }: CombinationLockProps) {
  const digits = targetPin.split("").map(Number);
  // Start each dial at 0
  const [values, setValues] = useState<number[]>([0, 0, 0, 0]);
  const [matched, setMatched] = useState(false);

  const handleChange = (dialIdx: number, digit: number) => {
    const next = [...values];
    next[dialIdx] = digit;
    setValues(next);

    const isMatch = next.every((v, i) => v === digits[i]);
    if (isMatch && !matched) {
      setMatched(true);
      setTimeout(onMatch, 500); // small delay so user sees the green light
    } else if (!isMatch) {
      setMatched(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="combo-lock-wrap">
        {[0, 1, 2, 3].map(dialIdx => (
          <div key={dialIdx} className="dial">
            <div
              className="nonagon"
              style={{ transform: `rotateX(${DIGIT_TO_ANGLE[values[dialIdx]]}deg)` }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <div key={d} className={`face face-${d}`}>
                  <input
                    type="radio"
                    name={`combo-wheel-${dialIdx}`}
                    className={`radio radio-${d}`}
                    checked={values[dialIdx] === d}
                    onChange={() => handleChange(dialIdx, d)}
                  />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Indicator light */}
        <div className={`combo-light ${matched ? "green" : ""}`} />

        {/* Arrows */}
        <div className="combo-arrow left" />
        <div className="combo-arrow right" />
      </div>
    </>
  );
}
