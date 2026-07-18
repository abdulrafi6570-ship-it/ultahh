/**
 * TwiboonApp — Twiboon photo collage maker (mobile-first)
 *
 * Flow:
 * 1. Pick template (grid of thumbnails)
 * 2. Editor opens: template displayed on canvas; auto-detected white slots
 *    shown with "+" icons. Tap a slot → pick from Gallery or Camera.
 *    Photo fills the slot (drag/pinch to reposition).
 * 3. When all slots filled → "Simpan" downloads full-res PNG.
 *
 * Slot detection: strict "pure white" threshold (R,G,B > 240 & saturation < 15)
 * — avoids catching pink/cream backgrounds that earlier heuristic caught.
 * No erosion step — erosion was shrinking slots out of existence.
 * Frame PNG is built once by punching transparent holes at slot bounding boxes.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, Download, Plus, Trash2,
  Camera, Image as ImageIcon, ZoomIn, ZoomOut,
} from "lucide-react";

const TEMPLATES = [
  { id: "t1",  name: "ID Card Kuning",         file: "t1-idcard.jpg" },
  { id: "t2",  name: "Frame Ikan Pink",         file: "t2-fishplush.jpg" },
  { id: "t3",  name: "Crayon Shinchan",         file: "t3-shinchan.jpg" },
  { id: "t4",  name: "Sylvanian Too Cute",      file: "t4-sylvanian.jpg" },
  { id: "t5",  name: "Kate & Jackson",          file: "t5-shaun.jpg" },
  { id: "t6",  name: "Nintendo Switch Fraises", file: "t6-switch.jpg" },
  { id: "t7",  name: "Pink Gingham Bow",        file: "t7-pinkbow.jpg" },
  { id: "t8",  name: "Favorite Person Merah",   file: "t8-redgirls.jpg" },
  { id: "t9",  name: "My Melody Christmas",     file: "t9-melody.jpg" },
  { id: "t10", name: "Lovely Date With You",    file: "t10-lovelydate.jpg" },
];

// ---------- types ----------
interface Slot {
  id: number;
  x: number; y: number; w: number; h: number; // in natural px
  photo: HTMLImageElement | null;
  photoScale: number;
  photoOx: number;  // photo centre x, in natural px
  photoOy: number;
  photoMinScale: number;
}

// ---------- helpers ----------
/** Strict "pure white" detection → no erosion, rectangular bbox per component. */
function detectSlots(img: HTMLImageElement): Slot[] {
  const W = img.naturalWidth, H = img.naturalHeight;
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  const ctx = tmp.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;

  // White mask — very strict so pink/cream backgrounds don't qualify
  const isW = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    const mn = Math.min(r, g, b), mx = Math.max(r, g, b);
    if (mx > 240 && mx - mn < 15) isW[p] = 1;
  }

  // BFS connected components — no erosion
  const visited = new Uint8Array(W * H);
  const EDGE = 20;
  const slots: Slot[] = [];
  let nextId = 1;

  for (let start = 0; start < W * H; start++) {
    if (!isW[start] || visited[start]) continue;
    const stack: number[] = [start];
    visited[start] = 1;
    let mnX = W, mxX = 0, mnY = H, mxY = 0, area = 0;

    while (stack.length) {
      const p = stack.pop()!;
      area++;
      const x = p % W, y = (p / W) | 0;
      if (x < mnX) mnX = x; if (x > mxX) mxX = x;
      if (y < mnY) mnY = y; if (y > mxY) mxY = y;
      for (const n of [p - 1, p + 1, p - W, p + W]) {
        if (n >= 0 && n < W * H && isW[n] && !visited[n]) {
          visited[n] = 1; stack.push(n);
        }
      }
    }

    const bw = mxX - mnX, bh = mxY - mnY;
    if (
      bw < 50 || bh < 50 ||                          // too small
      area < W * H * 0.004 ||                         // < 0.4% of image
      bw * bh > W * H * 0.88 ||                       // basically the whole image
      mnX < EDGE || mnY < EDGE ||
      mxX > W - EDGE || mxY > H - EDGE               // touching edge
    ) continue;

    slots.push({
      id: nextId++,
      x: mnX, y: mnY, w: bw, h: bh,
      photo: null,
      photoScale: 1, photoMinScale: 1,
      photoOx: mnX + bw / 2, photoOy: mnY + bh / 2,
    });
  }

  return slots.sort((a, b) => a.y - b.y || a.x - b.x);
}

/** Punch rectangular holes in the template at each slot's bounding box.
 *  Returns an off-screen canvas (the "frame") to draw on top of photos. */
function buildFrame(img: HTMLImageElement, slots: Slot[]): HTMLCanvasElement {
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  // Use destination-out to erase hole rectangles
  ctx.globalCompositeOperation = "destination-out";
  for (const s of slots) {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  ctx.globalCompositeOperation = "source-over";
  return c;
}

/** Draw one slot's photo layer to `out` canvas. */
function renderSlotPhoto(slot: Slot, out: HTMLCanvasElement) {
  const ctx = out.getContext("2d")!;
  if (!slot.photo) return;
  const ph = slot.photo;
  // Clip to slot rectangle
  ctx.save();
  ctx.beginPath();
  ctx.rect(slot.x, slot.y, slot.w, slot.h);
  ctx.clip();
  ctx.translate(slot.photoOx, slot.photoOy);
  ctx.scale(slot.photoScale, slot.photoScale);
  ctx.drawImage(ph, -ph.naturalWidth / 2, -ph.naturalHeight / 2);
  ctx.restore();
}

function clampPhoto(slot: Slot) {
  const ph = slot.photo; if (!ph) return;
  const hw = (ph.naturalWidth * slot.photoScale) / 2;
  const hh = (ph.naturalHeight * slot.photoScale) / 2;
  const left = slot.x, right = slot.x + slot.w;
  const top = slot.y, bot = slot.y + slot.h;
  slot.photoOx = Math.max(left + hw, Math.min(right - hw, slot.photoOx));
  slot.photoOy = Math.max(top + hh, Math.min(bot - hh, slot.photoOy));
  // If image smaller than slot, keep centred
  if (hw * 2 < slot.w) slot.photoOx = (left + right) / 2;
  if (hh * 2 < slot.h) slot.photoOy = (top + bot) / 2;
}

// ============================================================
export default function TwiboonApp() {
  const BASE = import.meta.env.BASE_URL;

  const [phase, setPhase] = useState<"pick" | "editor">("pick");
  const [progress, setProgress] = useState({ filled: 0, total: 0 });
  const [activeId, setActiveId] = useState<number | null>(null);
  const [addingBox, setAddingBox] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [noSlots, setNoSlots] = useState(false); // template had no detected slots

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const pendingSlotId = useRef<number | null>(null);

  const eng = useRef({
    templateImg: null as HTMLImageElement | null,
    frame: null as HTMLCanvasElement | null, // template with holes
    natW: 0, natH: 0,
    slots: [] as Slot[],
    activeId: null as number | null,
    addingBox: false,
    drawStart: null as { x: number; y: number } | null,
    dragState: null as { id: number; sx: number; sy: number; sox: number; soy: number } | null,
    nextId: 1,
    pinchStart: null as { dist: number; scale: number; slotId: number } | null,
  });

  // ── fit canvas CSS size to wrapper ─────────────────────────────────────────
  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const e = eng.current;
    if (!canvas || !wrap || !e.templateImg) return;
    const aw = wrap.clientWidth;
    const ah = wrap.clientHeight;
    if (!aw || !ah) return;
    const ratio = e.natH / e.natW;
    let cw = aw, ch = cw * ratio;
    if (ch > ah) { ch = ah; cw = ch / ratio; }
    canvas.style.width  = Math.floor(cw) + "px";
    canvas.style.height = Math.floor(ch) + "px";
  }, []);

  useEffect(() => {
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas]);

  // ── redraw canvas ───────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const e = eng.current;
    if (!canvas || !e.frame) return;
    const ctx = canvas.getContext("2d")!;
    const W = e.natW, H = e.natH;
    ctx.clearRect(0, 0, W, H);

    // 1. Draw all photo layers (behind frame)
    for (const s of e.slots) renderSlotPhoto(s, canvas);

    // 2. Draw the frame (template with transparent holes) on top
    ctx.drawImage(e.frame, 0, 0);

    // 3. Draw "+" on unfilled slots
    for (const s of e.slots) {
      if (s.photo) continue;
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const r = Math.min(Math.max(20, s.w * 0.1), 42);
      ctx.save();
      ctx.globalAlpha = e.activeId === s.id ? 1 : 0.85;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.93)"; ctx.fill();
      ctx.strokeStyle = "#ff7fb0"; ctx.lineWidth = r * 0.1; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - r * 0.5, cy); ctx.lineTo(cx + r * 0.5, cy);
      ctx.moveTo(cx, cy - r * 0.5); ctx.lineTo(cx, cy + r * 0.5);
      ctx.strokeStyle = "#ff7fb0"; ctx.lineWidth = r * 0.12; ctx.stroke();
      ctx.restore();
    }

    // 4. Active slot border
    const active = e.slots.find(s => s.id === e.activeId);
    if (active) {
      ctx.save();
      ctx.strokeStyle = "#ff4fa0";
      ctx.lineWidth = Math.max(3, W * 0.004);
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(active.x, active.y, active.w, active.h);
      ctx.restore();
    }
  }, []);

  const syncProgress = useCallback(() => {
    const e = eng.current;
    setProgress({ filled: e.slots.filter(s => s.photo).length, total: e.slots.length });
    setActiveId(e.activeId);
  }, []);

  // ── load template ───────────────────────────────────────────────────────────
  const loadTemplate = useCallback((src: string) => {
    const img = new Image();
    img.onload = () => {
      const e = eng.current;
      e.templateImg = img;
      e.natW = img.naturalWidth;
      e.natH = img.naturalHeight;
      e.slots = detectSlots(img);
      e.nextId = e.slots.length + 1;
      e.frame = buildFrame(img, e.slots);
      e.activeId = null;
      e.addingBox = false;
      setNoSlots(e.slots.length === 0);

      const canvas = canvasRef.current;
      if (canvas) { canvas.width = e.natW; canvas.height = e.natH; }
      setPhase("editor");
      // Wait a frame for DOM to settle, then fit + draw
      requestAnimationFrame(() => {
        fitCanvas();
        redraw();
        syncProgress();
      });
    };
    img.onerror = () => console.error("Template load failed:", src);
    img.src = src;
  }, [fitCanvas, redraw, syncProgress]);

  // ── coordinate helpers ──────────────────────────────────────────────────────
  const canvasPt = (clientX: number, clientY: number) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const e = eng.current;
    return {
      x: (clientX - r.left) * (e.natW / r.width),
      y: (clientY - r.top)  * (e.natH / r.height),
    };
  };

  const slotAt = (x: number, y: number): Slot | null => {
    for (const s of eng.current.slots) {
      if (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return s;
    }
    return null;
  };

  // ── photo apply ─────────────────────────────────────────────────────────────
  const applyPhoto = (file: File) => {
    const sid = pendingSlotId.current;
    setShowMenu(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const e = eng.current;
      const s = e.slots.find(s => s.id === sid); if (!s) return;
      const minScale = Math.max(s.w / img.naturalWidth, s.h / img.naturalHeight) * 1.02;
      s.photo = img;
      s.photoScale = minScale;
      s.photoMinScale = minScale;
      s.photoOx = s.x + s.w / 2;
      s.photoOy = s.y + s.h / 2;
      e.activeId = s.id;
      redraw(); syncProgress();
    };
    img.src = url;
  };

  // ── zoom ────────────────────────────────────────────────────────────────────
  const applyZoom = (s: Slot, factor: number) => {
    if (!s.photo) return;
    s.photoScale = Math.max(s.photoMinScale, Math.min(s.photoMinScale * 8, s.photoScale * factor));
    clampPhoto(s); redraw();
  };
  const activeSlot = () => eng.current.slots.find(s => s.id === eng.current.activeId && s.photo) ?? null;

  // ── pointer events ──────────────────────────────────────────────────────────
  const onPointerDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const e = eng.current;
    const pt = canvasPt(ev.clientX, ev.clientY);

    if (e.addingBox) { e.drawStart = pt; return; }

    const s = slotAt(pt.x, pt.y);
    if (!s) { e.activeId = null; redraw(); syncProgress(); return; }

    if (!s.photo) {
      pendingSlotId.current = s.id;
      const rect = canvasRef.current!.getBoundingClientRect();
      const scx = rect.left + (s.x + s.w / 2) * (rect.width  / e.natW);
      const scy = rect.top  + (s.y + s.h / 2) * (rect.height / e.natH);
      setMenuPos({ x: scx, y: scy });
      setShowMenu(true);
      return;
    }

    e.activeId = s.id;
    e.dragState = { id: s.id, sx: pt.x, sy: pt.y, sox: s.photoOx, soy: s.photoOy };
    (ev.currentTarget as HTMLCanvasElement).setPointerCapture(ev.pointerId);
    redraw(); syncProgress();
  };

  const onPointerMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const e = eng.current; if (!e.dragState) return;
    const pt = canvasPt(ev.clientX, ev.clientY);
    const s = e.slots.find(s => s.id === e.dragState!.id); if (!s || !s.photo) return;
    s.photoOx = e.dragState.sox + (pt.x - e.dragState.sx);
    s.photoOy = e.dragState.soy + (pt.y - e.dragState.sy);
    clampPhoto(s); redraw();
  };

  const onPointerUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const e = eng.current;
    if (e.addingBox && e.drawStart) {
      const p2 = canvasPt(ev.clientX, ev.clientY);
      const x = Math.min(e.drawStart.x, p2.x), y = Math.min(e.drawStart.y, p2.y);
      const w = Math.abs(p2.x - e.drawStart.x), h = Math.abs(p2.y - e.drawStart.y);
      e.drawStart = null;
      if (w > 20 && h > 20) {
        const id = e.nextId++;
        e.slots.push({ id, x, y, w, h, photo: null, photoScale: 1, photoMinScale: 1, photoOx: x+w/2, photoOy: y+h/2 });
        e.frame = buildFrame(e.templateImg!, e.slots);
        redraw(); syncProgress();
      }
      e.addingBox = false; setAddingBox(false);
      return;
    }
    e.dragState = null;
  };

  const onWheel = (ev: React.WheelEvent<HTMLCanvasElement>) => {
    const pt = canvasPt(ev.clientX, ev.clientY);
    const s = slotAt(pt.x, pt.y); if (!s) return;
    ev.preventDefault();
    applyZoom(s, ev.deltaY < 0 ? 1.07 : 0.93);
  };

  // Touch pinch-to-zoom
  const touchRef = useRef<{ dist: number; scale: number; slotId: number } | null>(null);
  const onTouchStart = (ev: React.TouchEvent<HTMLCanvasElement>) => {
    if (ev.touches.length !== 2) return;
    const [t1, t2] = [ev.touches[0], ev.touches[1]];
    const mid = canvasPt((t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2);
    const s = slotAt(mid.x, mid.y); if (!s || !s.photo) return;
    eng.current.dragState = null;
    touchRef.current = { dist: Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY), scale: s.photoScale, slotId: s.id };
  };
  const onTouchMove = (ev: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchRef.current || ev.touches.length !== 2) return;
    const d = Math.hypot(ev.touches[0].clientX - ev.touches[1].clientX, ev.touches[0].clientY - ev.touches[1].clientY);
    const tc = touchRef.current;
    const s = eng.current.slots.find(s => s.id === tc.slotId); if (!s || !s.photo) return;
    s.photoScale = Math.max(s.photoMinScale, tc.scale * (d / tc.dist));
    clampPhoto(s); redraw();
  };

  // ── download ────────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const e = eng.current; if (!e.frame) return;
    const out = document.createElement("canvas");
    out.width = e.natW; out.height = e.natH;
    const ctx = out.getContext("2d")!;
    // Photos behind frame
    for (const s of e.slots) renderSlotPhoto(s, out);
    ctx.drawImage(e.frame, 0, 0);
    out.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "twiboon.png"; a.click();
    }, "image/png");
  };

  const deleteActive = () => {
    const e = eng.current; if (!e.activeId) return;
    e.slots = e.slots.filter(s => s.id !== e.activeId);
    e.activeId = null;
    e.frame = buildFrame(e.templateImg!, e.slots);
    redraw(); syncProgress();
  };

  const canSave = progress.total > 0 && progress.filled === progress.total;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden bg-[#FFF5F9]"
      onClick={() => showMenu && setShowMenu(false)}
    >
      <AnimatePresence mode="wait">

        {/* ──── TEMPLATE PICKER ────────────────────────────────────────── */}
        {phase === "pick" && (
          <motion.div
            key="pick"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}
          >
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                Tempel Twiboon 📸
              </h1>
              <p className="text-foreground/50 text-xs mt-0.5">Pilih template, lalu isi fotomu!</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {TEMPLATES.map(t => (
                  <motion.button
                    key={t.id}
                    className="rounded-2xl overflow-hidden bg-white/80 border-2 border-transparent hover:border-[#FFB6D9] active:border-[#D45A8F] transition-all shadow-md cursor-pointer text-left"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => loadTemplate(`${BASE}twiboon/${t.file}`)}
                  >
                    <img src={`${BASE}twiboon/${t.file}`} alt={t.name} loading="lazy" className="w-full h-24 object-cover" />
                    <p className="px-1.5 py-1 text-[9px] font-semibold text-foreground/60 leading-tight">{t.name}</p>
                  </motion.button>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#FFB6D9]/50 text-[#D45A8F] text-sm font-semibold cursor-pointer hover:bg-[#FFB6D9]/10 transition-colors">
                <Plus className="w-4 h-4" /> Upload Template Sendiri
                <input type="file" accept="image/*" className="hidden" onChange={ev => {
                  const f = ev.target.files?.[0]; if (!f) return;
                  loadTemplate(URL.createObjectURL(f)); ev.target.value = "";
                }} />
              </label>
              <p className="text-[10px] text-foreground/35 text-center mt-1.5">Template harus punya kotak putih/transparan sebagai slot foto</p>
            </div>
          </motion.div>
        )}

        {/* ──── EDITOR ─────────────────────────────────────────────────── */}
        {phase === "editor" && (
          <motion.div
            key="editor"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}
          >
            {/* Top bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-3 pb-2">
              <button
                onClick={() => {
                  const e = eng.current;
                  e.slots = []; e.activeId = null; e.templateImg = null; e.frame = null;
                  setActiveId(null); setProgress({ filled: 0, total: 0 }); setPhase("pick");
                }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#FFB6D9]/30 text-foreground/60 text-xs font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Template
              </button>

              <div className="flex-1 text-center">
                {noSlots ? (
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-semibold">
                    Slot tidak terdeteksi — tambah manual ↓
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/70 border border-[#FFB6D9]/25 text-xs font-bold text-[#D45A8F]">
                    {progress.filled}/{progress.total} foto
                  </span>
                )}
              </div>

              <button
                onClick={handleDownload}
                disabled={progress.total === 0 || progress.filled < progress.total}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFB6D9] hover:bg-[#D45A8F] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>

            {/* Canvas wrapper — fills all remaining height */}
            <div
              ref={wrapRef}
              className="flex-1 relative flex items-center justify-center mx-3 rounded-2xl overflow-hidden"
              style={{
                minHeight: 0,
                background: "repeating-conic-gradient(#e8e0ea 0% 25%, #f5f0f7 0% 50%) 0 0 / 14px 14px",
              }}
            >
              <canvas
                ref={canvasRef}
                className="block touch-none select-none"
                style={{ cursor: addingBox ? "crosshair" : "pointer", maxWidth: "100%", maxHeight: "100%", display: "block" }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { eng.current.dragState = null; }}
                onWheel={onWheel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={() => { touchRef.current = null; }}
              />
              {progress.filled < progress.total && progress.total > 0 && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/95 border border-[#FFB6D9]/40 text-[#D45A8F] text-xs font-semibold px-3 py-1.5 rounded-full shadow pointer-events-none whitespace-nowrap">
                  Tap kotak + untuk isi foto ✨
                </div>
              )}
            </div>

            {/* Bottom toolbar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5">
              <button
                onClick={() => { setAddingBox(v => { eng.current.addingBox = !v; return !v; }); }}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  addingBox ? "bg-[#FFB6D9] border-[#FFB6D9] text-white" : "border-[#FFB6D9]/30 text-foreground/60 hover:bg-[#FFB6D9]/10"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> {addingBox ? "Gambar…" : "Tambah"}
              </button>

              <button
                onClick={deleteActive}
                disabled={!activeId}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>

              <div className="flex gap-1.5 ml-auto">
                <button
                  onClick={() => { const s = activeSlot(); if (s) applyZoom(s, 1.12); }}
                  className="w-9 h-9 rounded-xl border border-[#FFB6D9]/30 flex items-center justify-center text-[#D45A8F] hover:bg-[#FFB6D9]/15 transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { const s = activeSlot(); if (s) applyZoom(s, 0.9); }}
                  className="w-9 h-9 rounded-xl border border-[#FFB6D9]/30 flex items-center justify-center text-[#D45A8F] hover:bg-[#FFB6D9]/15 transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Photo source menu ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              className="fixed inset-0 z-[150]"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              className="fixed z-[160] flex flex-col gap-0.5 p-2 rounded-2xl bg-white/97 backdrop-blur-md border border-[#FFB6D9]/30 shadow-2xl"
              style={{
                left: Math.min(Math.max(menuPos.x - 90, 8), window.innerWidth - 210),
                top: Math.min(menuPos.y + 8, window.innerHeight - 140),
              }}
              initial={{ opacity: 0, scale: 0.88, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: "spring", damping: 22, stiffness: 340 }}
              onClick={ev => ev.stopPropagation()}
            >
              <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#FFB6D9]/10 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#E8F4FF] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-[#5B9FD4]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Galeri</p>
                  <p className="text-[10px] text-foreground/45">Pilih dari foto di hp</p>
                </div>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                  onChange={ev => { const f = ev.target.files?.[0]; if (f) applyPhoto(f); if (galleryRef.current) galleryRef.current.value = ""; }} />
              </label>

              <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#FFB6D9]/10 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F8] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-[#D45A8F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Kamera</p>
                  <p className="text-[10px] text-foreground/45">Foto langsung sekarang</p>
                </div>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={ev => { const f = ev.target.files?.[0]; if (f) applyPhoto(f); if (cameraRef.current) cameraRef.current.value = ""; }} />
              </label>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hidden inputs (needed for Safari camera capture) */}
    </div>
  );
}
