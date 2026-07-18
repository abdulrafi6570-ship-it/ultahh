/**
 * TwiboonApp — "Tempel Twiboon" ported to React (mobile-first layout)
 * Auto-detects white/transparent photo slots in a template image,
 * lets user fill each slot from gallery or camera, then save result.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Download, Plus, Trash2, Camera, Image as ImageIcon, ZoomIn, ZoomOut } from "lucide-react";

const TEMPLATES = [
  { id: "t1",  name: "ID Card Kuning",          file: "t1-idcard.jpg" },
  { id: "t2",  name: "Frame Ikan Pink",          file: "t2-fishplush.jpg" },
  { id: "t3",  name: "Crayon Shinchan",          file: "t3-shinchan.jpg" },
  { id: "t4",  name: "Sylvanian Too Cute",       file: "t4-sylvanian.jpg" },
  { id: "t5",  name: "Kate & Jackson",           file: "t5-shaun.jpg" },
  { id: "t6",  name: "Nintendo Switch Fraises",  file: "t6-switch.jpg" },
  { id: "t7",  name: "Pink Gingham Bow",         file: "t7-pinkbow.jpg" },
  { id: "t8",  name: "Favorite Person Merah",    file: "t8-redgirls.jpg" },
  { id: "t9",  name: "My Melody Christmas",      file: "t9-melody.jpg" },
  { id: "t10", name: "Lovely Date With You",     file: "t10-lovelydate.jpg" },
];

interface Photo { img: HTMLImageElement; scale: number; minScale: number; ox: number; oy: number }
interface Slot {
  id: number; label: number; manual: boolean;
  minX: number; minY: number; maxX: number; maxY: number;
  photo: Photo | null;
  mask: HTMLCanvasElement;
  layer: HTMLCanvasElement;
}

function buildMaskFromLabel(w: number, h: number, labels: Int32Array, lbl: number): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const cx = c.getContext("2d")!;
  const id = cx.createImageData(w, h);
  for (let p = 0; p < w * h; p++) if (labels[p] === lbl) id.data[p * 4 + 3] = 255;
  cx.putImageData(id, 0, 0);
  return c;
}

function buildMaskFromRect(w: number, h: number, minX: number, minY: number, maxX: number, maxY: number): HTMLCanvasElement {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const cx = c.getContext("2d")!;
  cx.fillStyle = "#fff";
  cx.fillRect(minX, minY, maxX - minX, maxY - minY);
  return c;
}

function detectSlots(img: HTMLImageElement): Slot[] {
  const w = img.naturalWidth, h = img.naturalHeight;
  const work = document.createElement("canvas"); work.width = w; work.height = h;
  const wctx = work.getContext("2d", { willReadFrequently: true })!;
  wctx.drawImage(img, 0, 0, w, h);
  const data = wctx.getImageData(0, 0, w, h).data;

  let isEmpty = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 15) { isEmpty[p] = 1; continue; }
    if ((r + g + b) / 3 > 195 && Math.max(r, g, b) - Math.min(r, g, b) < 40) isEmpty[p] = 1;
  }
  const ERODE = 5;
  for (let it = 0; it < ERODE; it++) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (isEmpty[p] && x > 0 && isEmpty[p-1] && x < w-1 && isEmpty[p+1] && y > 0 && isEmpty[p-w] && y < h-1 && isEmpty[p+w]) next[p] = 1;
    }
    isEmpty = next;
  }

  const labels = new Int32Array(w * h).fill(-1);
  let nextLabel = 0;
  const stack = new Int32Array(w * h);
  const bbox: { minX: number; minY: number; maxX: number; maxY: number; area: number }[] = [];

  for (let start = 0; start < w * h; start++) {
    if (!isEmpty[start] || labels[start] !== -1) continue;
    let sp = 0; stack[sp++] = start; labels[start] = nextLabel;
    let minX = start % w, maxX = minX, minY = (start/w)|0, maxY = minY, area = 0;
    while (sp > 0) {
      const p = stack[--sp]; area++;
      const x = p % w, y = (p/w)|0;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (x > 0 && isEmpty[p-1] && labels[p-1]===-1) { labels[p-1]=nextLabel; stack[sp++]=p-1; }
      if (x < w-1 && isEmpty[p+1] && labels[p+1]===-1) { labels[p+1]=nextLabel; stack[sp++]=p+1; }
      if (y > 0 && isEmpty[p-w] && labels[p-w]===-1) { labels[p-w]=nextLabel; stack[sp++]=p-w; }
      if (y < h-1 && isEmpty[p+w] && labels[p+w]===-1) { labels[p+w]=nextLabel; stack[sp++]=p+w; }
    }
    bbox[nextLabel] = { minX, minY, maxX, maxY, area };
    nextLabel++;
  }

  const minArea = Math.max(1200, w * h * 0.003);
  const margin = ERODE + 8;
  const found: { lbl: number; minX: number; minY: number; maxX: number; maxY: number }[] = [];
  for (let lbl = 0; lbl < nextLabel; lbl++) {
    const b = bbox[lbl];
    if (b.area < minArea) continue;
    const bw = b.maxX - b.minX, bh = b.maxY - b.minY;
    if (bw < 20 || bh < 20 || (bw > 0.85*w && bh > 0.85*h)) continue;
    if (b.minX <= margin || b.minY <= margin || b.maxX >= w-margin || b.maxY >= h-margin) continue;
    found.push({ lbl, ...b });
  }
  found.sort((a, b) => a.minY - b.minY || a.minX - b.minX);

  let nextId = 1;
  return found.map(f => ({
    id: nextId++, label: f.lbl, manual: false,
    minX: f.minX, minY: f.minY, maxX: f.maxX, maxY: f.maxY,
    photo: null, mask: buildMaskFromLabel(w, h, labels, f.lbl),
    layer: document.createElement("canvas"),
  }));
}

function buildHoleTemplate(templateImg: HTMLImageElement, slots: Slot[]): HTMLCanvasElement {
  const w = templateImg.naturalWidth, h = templateImg.naturalHeight;
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const cctx = c.getContext("2d")!;
  cctx.drawImage(templateImg, 0, 0, w, h);
  const imgData = cctx.getImageData(0, 0, w, h);
  slots.forEach(s => {
    const md = s.mask.getContext("2d")!.getImageData(0, 0, w, h).data;
    for (let p = 0; p < w * h; p++) if (md[p*4+3] > 0) imgData.data[p*4+3] = 0;
  });
  cctx.putImageData(imgData, 0, 0);
  return c;
}

function renderSlotLayer(slot: Slot, natW: number, natH: number) {
  slot.layer.width = natW; slot.layer.height = natH;
  const lctx = slot.layer.getContext("2d")!;
  lctx.clearRect(0, 0, natW, natH);
  if (!slot.photo) return;
  const ph = slot.photo;
  lctx.save();
  lctx.translate(ph.ox, ph.oy);
  lctx.scale(ph.scale, ph.scale);
  lctx.drawImage(ph.img, -ph.img.width/2, -ph.img.height/2);
  lctx.restore();
  lctx.globalCompositeOperation = "destination-in";
  lctx.drawImage(slot.mask, 0, 0);
  lctx.globalCompositeOperation = "source-over";
}

function clampPhoto(slot: Slot) {
  const ph = slot.photo; if (!ph) return;
  const hw = (ph.img.width * ph.scale) / 2, hh = (ph.img.height * ph.scale) / 2;
  ph.ox = Math.min(Math.max(ph.ox, Math.min(slot.minX+hw, (slot.minX+slot.maxX)/2)), Math.max(slot.maxX-hw, (slot.minX+slot.maxX)/2));
  ph.oy = Math.min(Math.max(ph.oy, Math.min(slot.minY+hh, (slot.minY+slot.maxY)/2)), Math.max(slot.maxY-hh, (slot.minY+slot.maxY)/2));
}

export default function TwiboonApp() {
  const BASE = import.meta.env.BASE_URL;
  const [phase, setPhase] = useState<"pick" | "editor">("pick");
  const [progress, setProgress] = useState({ filled: 0, total: 0 });
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [addingBox, setAddingBox] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef  = useRef<HTMLInputElement>(null);
  const pendingSlot = useRef<Slot | null>(null);

  const eng = useRef({
    templateImg: null as HTMLImageElement | null,
    natW: 0, natH: 0,
    slots: [] as Slot[],
    holeTemplate: null as HTMLCanvasElement | null,
    activeSlotId: null as number | null,
    addingBox: false,
    drawStart: null as { x: number; y: number } | null,
    dragState: null as { slot: Slot; sx: number; sy: number; sox: number; soy: number } | null,
    nextId: 1,
  });

  // ── fit canvas to available space ─────────────────────────────────────────
  // We calculate directly from window size to avoid relying on flex clientHeight
  // which may be 0 when the canvas is first mounted inside a scrolling container.
  //   navbar  ≈ 100px  (tabs + strip)
  //   top bar ≈  48px  (template / progress / save row)
  //   bot bar ≈  52px  (tambah / hapus / zoom row)
  //   padding ≈  28px  (vertical gaps)
  const CHROME_H = 100 + 48 + 52 + 28;

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const e = eng.current;
    if (!canvas || !e.templateImg) return;
    const availW = window.innerWidth  - 24;   // horizontal padding
    const availH = window.innerHeight - CHROME_H;
    const ratio  = e.natH / e.natW;
    let cssW = availW;
    let cssH = cssW * ratio;
    if (cssH > availH) { cssH = availH; cssW = cssH / ratio; }
    canvas.style.width  = Math.floor(cssW) + "px";
    canvas.style.height = Math.floor(cssH) + "px";
  }, []);

  useEffect(() => {
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas]);

  // ── draw ─────────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const e = eng.current;
    if (!canvas || !e.templateImg || !e.holeTemplate) return;
    const ctx = canvas.getContext("2d")!;
    const w = e.natW, h = e.natH;
    ctx.clearRect(0, 0, w, h);
    e.slots.forEach(s => ctx.drawImage(s.layer, 0, 0));
    ctx.drawImage(e.holeTemplate, 0, 0);
    e.slots.forEach(s => {
      if (s.photo) return;
      const cx = (s.minX+s.maxX)/2, cy = (s.minY+s.maxY)/2;
      const r = Math.max(18, Math.min(34, (s.maxX-s.minX)*0.12));
      ctx.save();
      ctx.globalAlpha = e.activeSlotId === s.id ? 1 : 0.85;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fill();
      ctx.strokeStyle = "#ff7fb0"; ctx.lineWidth = Math.max(2, r*0.08); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx-r*0.5, cy); ctx.lineTo(cx+r*0.5, cy);
      ctx.moveTo(cx, cy-r*0.5); ctx.lineTo(cx, cy+r*0.5);
      ctx.strokeStyle = "#ff7fb0"; ctx.lineWidth = Math.max(2, r*0.12); ctx.stroke();
      ctx.restore();
    });
    const active = e.slots.find(s => s.id === e.activeSlotId);
    if (active) {
      ctx.save();
      ctx.strokeStyle = "#ff4fa0"; ctx.lineWidth = Math.max(3, w*0.004);
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(active.minX, active.minY, active.maxX-active.minX, active.maxY-active.minY);
      ctx.restore();
    }
  }, []);

  const syncProgress = useCallback(() => {
    const e = eng.current;
    setProgress({ filled: e.slots.filter(s => s.photo).length, total: e.slots.length });
    setActiveSlotId(e.activeSlotId);
  }, []);

  // ── load template ─────────────────────────────────────────────────────────
  const loadTemplate = useCallback((src: string) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const e = eng.current;
      e.templateImg = img; e.natW = img.naturalWidth; e.natH = img.naturalHeight;
      e.slots = detectSlots(img);
      e.nextId = e.slots.length + 1;
      e.holeTemplate = buildHoleTemplate(img, e.slots);
      e.activeSlotId = null; e.addingBox = false;
      const canvas = canvasRef.current;
      if (canvas) { canvas.width = e.natW; canvas.height = e.natH; }
      setPhase("editor");
      // fitCanvas needs DOM, defer
      requestAnimationFrame(() => { fitCanvas(); redraw(); syncProgress(); });
    };
    img.src = src;
  }, [fitCanvas, redraw, syncProgress]);

  // ── coordinate helpers ────────────────────────────────────────────────────
  const canvasPt = (clientX: number, clientY: number) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: (clientX-r.left)*(eng.current.natW/r.width), y: (clientY-r.top)*(eng.current.natH/r.height) };
  };
  const slotAt = (x: number, y: number) => {
    for (const s of eng.current.slots) {
      if (x >= s.minX && x <= s.maxX && y >= s.minY && y <= s.maxY) {
        const px = s.mask.getContext("2d")!.getImageData(Math.min(x|0, eng.current.natW-1), Math.min(y|0, eng.current.natH-1), 1, 1).data;
        if (px[3] > 0) return s;
      }
    }
    return null;
  };

  // ── photo apply ───────────────────────────────────────────────────────────
  const applyPhoto = (file: File) => {
    const s = pendingSlot.current; if (!s) return;
    setShowPhotoMenu(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const bw = s.maxX-s.minX, bh = s.maxY-s.minY;
      const minScale = Math.max(bw/img.width, bh/img.height) * 1.02;
      s.photo = { img, scale: minScale, minScale, ox: (s.minX+s.maxX)/2, oy: (s.minY+s.maxY)/2 };
      renderSlotLayer(s, eng.current.natW, eng.current.natH);
      eng.current.activeSlotId = s.id;
      redraw(); syncProgress();
    };
    img.src = url;
  };

  // ── zoom ──────────────────────────────────────────────────────────────────
  const applyZoom = (s: Slot, factor: number) => {
    if (!s.photo) return;
    s.photo.scale = Math.max(s.photo.minScale, Math.min(s.photo.minScale*6, s.photo.scale*factor));
    clampPhoto(s); renderSlotLayer(s, eng.current.natW, eng.current.natH); redraw();
  };
  const activeSlotObj = () => eng.current.slots.find(s => s.id === eng.current.activeSlotId && s.photo) ?? null;

  // ── pointer events ────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eg = eng.current;
    if (eg.addingBox) { eg.drawStart = canvasPt(e.clientX, e.clientY); return; }
    const pt = canvasPt(e.clientX, e.clientY);
    const s = slotAt(pt.x, pt.y);
    if (!s) { eg.activeSlotId = null; redraw(); syncProgress(); return; }
    if (!s.photo) {
      pendingSlot.current = s;
      const rect = canvasRef.current!.getBoundingClientRect();
      // Position menu near the slot center in screen coords
      const slotCx = rect.left + ((s.minX+s.maxX)/2) * (rect.width/eg.natW);
      const slotCy = rect.top  + ((s.minY+s.maxY)/2) * (rect.height/eg.natH);
      setMenuPos({ x: slotCx, y: slotCy });
      setShowPhotoMenu(true);
      return;
    }
    eg.activeSlotId = s.id;
    eg.dragState = { slot: s, sx: pt.x, sy: pt.y, sox: s.photo.ox, soy: s.photo.oy };
    (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    redraw(); syncProgress();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eg = eng.current; if (!eg.dragState) return;
    const pt = canvasPt(e.clientX, e.clientY);
    const s = eg.dragState.slot; if (!s.photo) return;
    s.photo.ox = eg.dragState.sox + (pt.x - eg.dragState.sx);
    s.photo.oy = eg.dragState.soy + (pt.y - eg.dragState.sy);
    clampPhoto(s); renderSlotLayer(s, eg.natW, eg.natH); redraw();
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const eg = eng.current;
    if (eg.addingBox && eg.drawStart) {
      const p2 = canvasPt(e.clientX, e.clientY);
      const minX = Math.min(eg.drawStart.x, p2.x), maxX = Math.max(eg.drawStart.x, p2.x);
      const minY = Math.min(eg.drawStart.y, p2.y), maxY = Math.max(eg.drawStart.y, p2.y);
      eg.drawStart = null;
      if (maxX-minX >= 20 && maxY-minY >= 20) {
        const id = eg.nextId++;
        const mask = buildMaskFromRect(eg.natW, eg.natH, minX, minY, maxX, maxY);
        eg.slots.push({ id, label:-1, manual:true, minX, minY, maxX, maxY, photo:null, mask, layer:document.createElement("canvas") });
        eg.holeTemplate = buildHoleTemplate(eg.templateImg!, eg.slots);
        redraw(); syncProgress();
      }
      eg.addingBox = false; setAddingBox(false);
      return;
    }
    eg.dragState = null;
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const pt = canvasPt(e.clientX, e.clientY);
    const s = slotAt(pt.x, pt.y); if (!s) return;
    e.preventDefault();
    applyZoom(s, e.deltaY < 0 ? 1.06 : 0.94);
  };

  const touchRef = useRef<{ slot: Slot; startDist: number; startScale: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2) return;
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const mid = canvasPt((t1.clientX+t2.clientX)/2, (t1.clientY+t2.clientY)/2);
    const s = slotAt(mid.x, mid.y); if (!s || !s.photo) return;
    eng.current.dragState = null;
    touchRef.current = { slot: s, startDist: Math.hypot(t1.clientX-t2.clientX, t1.clientY-t2.clientY), startScale: s.photo.scale };
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchRef.current || e.touches.length !== 2) return;
    const d = Math.hypot(e.touches[0].clientX-e.touches[1].clientX, e.touches[0].clientY-e.touches[1].clientY);
    const tc = touchRef.current; const s = tc.slot; if (!s.photo) return;
    s.photo.scale = Math.max(s.photo.minScale, tc.startScale*(d/tc.startDist));
    clampPhoto(s); renderSlotLayer(s, eng.current.natW, eng.current.natH); redraw();
  };

  // ── download ──────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const e = eng.current; if (!e.holeTemplate) return;
    const out = document.createElement("canvas"); out.width = e.natW; out.height = e.natH;
    const octx = out.getContext("2d")!;
    e.slots.forEach(s => octx.drawImage(s.layer, 0, 0));
    octx.drawImage(e.holeTemplate, 0, 0);
    out.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = "twiboon.png"; a.click();
    }, "image/png");
  };

  const deleteActiveSlot = () => {
    const e = eng.current; if (!e.activeSlotId) return;
    e.slots = e.slots.filter(s => s.id !== e.activeSlotId);
    e.activeSlotId = null;
    e.holeTemplate = buildHoleTemplate(e.templateImg!, e.slots);
    redraw(); syncProgress();
  };

  const canSave = progress.total > 0 && progress.filled === progress.total;

  return (
    <div className="w-full flex flex-col" style={{ height: "calc(100dvh - 6rem)" }} onClick={() => showPhotoMenu && setShowPhotoMenu(false)}>

      <AnimatePresence mode="wait">
        {/* ── PICK TEMPLATE ──────────────────────────────────────────────── */}
        {phase === "pick" && (
          <motion.div
            key="pick"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                Tempel Twiboon 📸
              </h1>
              <p className="text-foreground/50 text-xs mt-0.5">Pilih template, lalu isi fotomu!</p>
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {TEMPLATES.map(t => (
                  <motion.button
                    key={t.id}
                    className="rounded-2xl overflow-hidden bg-white/80 border-2 border-transparent hover:border-[#FFB6D9] transition-all shadow-md cursor-pointer text-left"
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => loadTemplate(`${BASE}twiboon/${t.file}`)}
                  >
                    <img src={`${BASE}twiboon/${t.file}`} alt={t.name} loading="lazy" className="w-full h-24 object-cover" />
                    <p className="px-1.5 py-1 text-[9px] font-semibold text-foreground/60 leading-tight">{t.name}</p>
                  </motion.button>
                ))}
              </div>

              <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#FFB6D9]/50 text-[#D45A8F] text-sm font-semibold cursor-pointer hover:bg-[#FFB6D9]/10 transition-colors">
                <Plus className="w-4 h-4" /> Upload Template Sendiri
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0]; if (!f) return;
                  loadTemplate(URL.createObjectURL(f)); e.target.value = "";
                }} />
              </label>
              <p className="text-[10px] text-foreground/35 text-center mt-1.5">Template harus punya kotak putih/transparan</p>
            </div>
          </motion.div>
        )}

        {/* ── EDITOR ──────────────────────────────────────────────────────── */}
        {phase === "editor" && (
          <motion.div
            key="editor"
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
          >
            {/* Top bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-3 pb-2">
              <button
                onClick={() => { setPhase("pick"); const e = eng.current; e.slots = []; e.activeSlotId = null; setActiveSlotId(null); setProgress({ filled:0, total:0 }); }}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#FFB6D9]/30 text-foreground/60 text-xs font-semibold hover:bg-[#FFB6D9]/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Template
              </button>

              <div className="flex-1 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-white/70 border border-[#FFB6D9]/25 text-xs font-bold text-[#D45A8F]">
                  {progress.filled}/{progress.total} foto
                </span>
              </div>

              <button
                onClick={handleDownload}
                disabled={!canSave}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFB6D9] hover:bg-[#D45A8F] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer shadow-sm flex-shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> Simpan
              </button>
            </div>

            {/* Canvas — fills all remaining space */}
            <div
              ref={canvasWrapRef}
              className="flex-1 relative flex items-center justify-center mx-3 rounded-2xl overflow-hidden"
              style={{ background: "repeating-conic-gradient(#e8e0ea 0% 25%, #f5f0f7 0% 50%) 0 0 / 14px 14px", minHeight: 0 }}
            >
              <canvas
                ref={canvasRef}
                className="block touch-none"
                style={{ cursor: addingBox ? "crosshair" : "pointer", maxWidth: "100%", maxHeight: "100%" }}
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
                  Tap kotak kosong → isi foto ✨
                </div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 flex-wrap">
              <button
                onClick={() => { setAddingBox(v => { eng.current.addingBox = !v; return !v; }); }}
                className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${addingBox ? "bg-[#FFB6D9] border-[#FFB6D9] text-white" : "border-[#FFB6D9]/30 text-foreground/60 hover:bg-[#FFB6D9]/10"}`}
              >
                <Plus className="w-3.5 h-3.5" />{addingBox ? "Gambar kotak…" : "Tambah"}
              </button>

              <button
                onClick={deleteActiveSlot}
                disabled={!activeSlotId}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>

              <div className="flex gap-1.5 ml-auto">
                <button onClick={() => { const s = activeSlotObj(); if (s) applyZoom(s, 1.15); }}
                  className="w-9 h-9 rounded-xl border border-[#FFB6D9]/30 flex items-center justify-center text-[#D45A8F] hover:bg-[#FFB6D9]/15 transition-colors cursor-pointer">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => { const s = activeSlotObj(); if (s) applyZoom(s, 0.87); }}
                  className="w-9 h-9 rounded-xl border border-[#FFB6D9]/30 flex items-center justify-center text-[#D45A8F] hover:bg-[#FFB6D9]/15 transition-colors cursor-pointer">
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo source menu ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPhotoMenu && (
          <>
            <motion.div className="fixed inset-0 z-[150]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPhotoMenu(false)} />
            <motion.div
              className="fixed z-[160] flex flex-col gap-0.5 p-2 rounded-2xl bg-white/97 backdrop-blur-md border border-[#FFB6D9]/30 shadow-2xl"
              style={{
                left: Math.min(Math.max(menuPos.x - 90, 8), window.innerWidth - 208),
                top:  Math.min(menuPos.y + 8, window.innerHeight - 130),
              }}
              initial={{ opacity: 0, scale: 0.88, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: "spring", damping: 22, stiffness: 340 }}
              onClick={e => e.stopPropagation()}
            >
              <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#FFB6D9]/10 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#E8F4FF] flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4 text-[#5B9FD4]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Galeri</p>
                  <p className="text-[10px] text-foreground/45">Foto di hp</p>
                </div>
                <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) applyPhoto(f); if (galleryRef.current) galleryRef.current.value = ""; }} />
              </label>

              <label className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-[#FFB6D9]/10 cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#FFF0F8] flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-[#D45A8F]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">Kamera</p>
                  <p className="text-[10px] text-foreground/45">Foto sekarang</p>
                </div>
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) applyPhoto(f); if (cameraRef.current) cameraRef.current.value = ""; }} />
              </label>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
