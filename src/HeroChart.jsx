import { useEffect, useRef } from "react";

// Нүүр хэсгийн хөдөлгөөнт шугаман график (canvas, нэмэлт сангүй)
export default function HeroChart({ theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const ac = css.getPropertyValue("--color-ac").trim();
    const line = css.getPropertyValue("--color-line").trim();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = 28;
    const series = [
      { color: ac, w: 3, amp: 0.14, base: 0.56, speed: 0.5, ph: 0, a: 1 },
      { color: line, w: 2, amp: 0.11, base: 0.7, speed: 0.35, ph: 2, a: 0.8 },
      { color: ac, w: 1.5, amp: 0.09, base: 0.42, speed: 0.4, ph: 4, a: 0.45 },
    ];
    let w = 0, h = 0, raf;

    const yAt = (s, k, t) =>
      h * (s.base - s.amp * Math.sin(k * 0.55 + t * s.speed + s.ph)
        - s.amp * 0.5 * Math.sin(k * 1.3 - t * s.speed * 0.7) - (k / N) * 0.14);

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      // нимгэн тор
      ctx.globalAlpha = 0.12; ctx.strokeStyle = line; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, (h * i) / 6); ctx.lineTo(w, (h * i) / 6); ctx.stroke(); }
      const r = Math.min(1, t / 2), ease = 1 - (1 - r) ** 3; // зүүнээс баруун тийш зурагдана
      const last = Math.max(1, Math.floor((N - 1) * ease));
      series.forEach((s) => {
        ctx.globalAlpha = s.a; ctx.strokeStyle = s.color; ctx.lineWidth = s.w; ctx.lineJoin = "round";
        ctx.beginPath();
        for (let k = 0; k <= last; k++) {
          const x = (k / (N - 1)) * w, y = yAt(s, k, t);
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = s.color;
        for (let k = 0; k <= last; k += 4) { ctx.beginPath(); ctx.arc((k / (N - 1)) * w, yAt(s, k, t), 3, 0, 7); ctx.fill(); }
        // үзүүрийн гэрэлтэх цэг
        ctx.shadowColor = s.color; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc((last / (N - 1)) * w, yAt(s, last, t), 5, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(5);
    };
    const t0 = performance.now();
    const loop = () => { draw((performance.now() - t0) / 1000); raf = requestAnimationFrame(loop); };
    resize(); addEventListener("resize", resize);
    if (!reduce) loop();
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [theme]);
  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full opacity-60" />;
}