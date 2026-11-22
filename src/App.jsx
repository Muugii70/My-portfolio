import { useEffect, useLayoutEffect, useRef, useState } from "react";
import data from "./content.json";
import HeroChart from "./HeroChart.jsx";

// Нийтлэг загварууд
const glass = "rounded-2xl border border-fg/10 bg-pn/60 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,.35)]";
const lift = "transition duration-300 hover:-translate-y-1 hover:border-ac/50 hover:shadow-[0_18px_40px_-16px_var(--color-ac)] motion-reduce:transition-none";
const btn = "cursor-pointer rounded-full border border-fg/15 bg-pn/60 px-4 py-1.5 backdrop-blur outline-none transition duration-200 hover:border-ac hover:text-ac focus-visible:ring-2 focus-visible:ring-ac active:scale-95 motion-reduce:transition-none";
const solid = "inline-block cursor-pointer rounded-full bg-gradient-to-r from-ac to-gold px-5 py-2.5 font-semibold text-bg outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_var(--color-ac)] focus-visible:ring-2 focus-visible:ring-ac focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none";
const ghost = "inline-block cursor-pointer rounded-full border border-fg/20 bg-pn/40 px-5 py-2.5 font-semibold backdrop-blur outline-none transition duration-200 hover:-translate-y-0.5 hover:border-ac hover:text-ac focus-visible:ring-2 focus-visible:ring-ac motion-reduce:transition-none";

const PATH = "M20 0 L8 90 L32 170 L10 260 L30 350 L12 430 L20 520";

// Зүүн талын шугаман график: гүйлгэх тусам зурагдана, замналын үйл явдал бүр дээр цэгтэй
function GrowthLine({ lang }) {
  const path = useRef(null);
  const marks = useRef([]);
  const [s, setS] = useState({ p: 0, L: 1, x: 20, y: 0 });
  const [ticks, setTicks] = useState([]);

  useEffect(() => {
    let raf;
    // transform-д автахгүйн тулд offsetTop-оор абсолют байрлалыг тооцно
    const top = (el) => { let t = 0; for (; el; el = el.offsetParent) t += el.offsetTop; return t; };

    // data-milestone элемент бүр шугамын аль хэсэгт таарахыг тооцно
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const L = path.current.getTotalLength();
      marks.current = [...document.querySelectorAll("[data-milestone]")].map((el) => {
        const p = Math.min(1, Math.max(0, (top(el) + el.offsetHeight / 2 - innerHeight / 2) / max));
        const pt = path.current.getPointAtLength(p * L);
        return { el, y: el.dataset.milestone, p, x: pt.x, yy: pt.y };
      });
      setTicks(marks.current.map(({ y, p, x, yy }) => ({ y, p, x, yy })));
    };

    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        const p = Math.min(1, scrollY / max), L = path.current.getTotalLength();
        const pt = path.current.getPointAtLength(p * L);
        setS({ p, L, x: pt.x, y: pt.y });
        // дэлгэцийн голд хүрсэн замналын картыг идэвхжүүлнэ
        marks.current.forEach((m) => { m.el.dataset.passed = String(p >= m.p); });
      });
    };
    const both = () => { measure(); on(); };

    both();
    const ro = new ResizeObserver(both);
    ro.observe(document.body);
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", both);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      removeEventListener("scroll", on); removeEventListener("resize", both);
    };
  }, [lang]);

  // Одоо хүрсэн сүүлийн үйл явдал, түүний он нь гэрэлтэх цэгийн хажууд гарна
  const cur = [...ticks].reverse().find((t) => s.p >= t.p);
  const lastP = ticks.length ? ticks[ticks.length - 1].p : 0;
  const showLabel = cur && s.p <= lastP + 0.05;

  return (
    <svg viewBox="0 0 40 520" aria-hidden="true" className="pointer-events-none fixed left-2 top-1/2 z-20 hidden h-[min(520px,70vh)] w-10 -translate-y-1/2 overflow-visible md:block">
      <path d={PATH} fill="none" className="stroke-line" strokeOpacity=".3" strokeWidth="2" />
      <path ref={path} d={PATH} fill="none" className="stroke-ac" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={s.L} strokeDashoffset={s.L * (1 - s.p)} />
      {ticks.map((t, i) => {
        const hit = s.p >= t.p;
        return <circle key={i} cx={t.x} cy={t.yy} r={hit ? 4 : 3} strokeWidth="2"
          className={"transition-all duration-300 " + (hit ? "fill-ac stroke-ac" : "fill-bg stroke-line")} />;
      })}
      <circle cx={s.x} cy={s.y} r="5" className="fill-ac" style={{ filter: "drop-shadow(0 0 6px var(--color-ac))" }} />
      {showLabel && (
        <text x={s.x + 14} y={s.y + 4} fontSize="12" fontWeight="700" className="fill-ac hidden lg:block">{cur.y}</text>
      )}
    </svg>
  );
}

function Chapter({ id, title, children }) {
  return (
    <section id={id} className="mx-auto max-w-3xl px-5 py-20 md:pl-16">
      <div data-reveal className="mb-8 flex items-center gap-3">
        <span className="size-2.5 rounded-full bg-gradient-to-r from-ac to-gold shadow-[0_0_12px_var(--color-ac)]" />
        <h2 className="font-display text-3xl font-bold tracking-tight">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-ac/50 to-transparent" />
      </div>
      {children}
    </section>
  );
}

function Timeline({ T, mn }) {
  const items = [...T.career].sort((a, b) => a.p.localeCompare(b.p));
  return (
    <ol className="border-l border-fg/15 pl-7">
      {items.map((c) => (
        <li key={c.o + c.p} data-reveal data-milestone={c.p.slice(0, 4)} className="group relative mb-10 last:mb-0">
          <span className={"absolute -left-[36px] top-1.5 size-3.5 rounded-full ring-4 ring-bg transition duration-500 group-data-[passed=true]:scale-125 group-data-[passed=true]:shadow-[0_0_14px_var(--color-ac)] " + (c.k === "edu" ? "bg-ac" : "bg-gold")} />
          <div className="text-xs opacity-70 transition duration-500 group-data-[passed=true]:font-bold group-data-[passed=true]:text-ac group-data-[passed=true]:opacity-100">
            {c.p} · {c.k === "edu" ? (mn ? "Боловсрол" : "Education") : (mn ? "Ажил" : "Work")}
          </div>
          <div className="mt-0.5 font-display text-xl font-bold tracking-tight">{c.t}</div>
          <div className="font-semibold text-ac">{c.o}</div>
          <div className="mt-1 opacity-85">{c.d}</div>
        </li>
      ))}
    </ol>
  );
}

// Хөвж буй чипүүд: чип бүр өөр хурд, чиглэл, хоцролттой хөдөлнө
function FloatChips({ items, variant }) {
  const pro = variant === "pro";
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-6 rounded-2xl border border-fg/10 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_srgb,var(--color-ac)_16%,transparent),transparent_60%)] px-5 py-9">
      {items.map((x, i) => (
        <li key={x} className="float-chip" style={{
          "--d": (4 + ((i * 7) % 5) * 0.7) + "s",
          "--dl": -(i * 0.9) + "s",
          "--dx": (((i * 5) % 7) - 3) * 1.5 + "px",
          "--dy": (i % 2 ? -1 : 1) * (6 + ((i * 3) % 7)) + "px",
          "--r": ((i % 3) - 1) * 1.2 + "deg",
        }}>
          <span className={"inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur transition duration-300 hover:scale-110 hover:shadow-[0_0_18px_var(--color-ac)] " +
            (pro ? "border-fg/15 bg-pn/70 hover:border-ac hover:text-ac" : "border-ac/40 bg-ac/15 hover:bg-ac hover:text-bg")}>
            <i aria-hidden="true" className={"size-2 rounded-full " + (pro ? "bg-ac" : "bg-gold")} />
            {x}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Skills({ T, skills }) {
  const group = (title, children, i) => (
    <div data-reveal style={{ animationDelay: i * 80 + "ms" }}>
      <h3 className="mb-3 font-display text-xl font-bold tracking-tight text-ac">{title}</h3>
      {children}
    </div>
  );
  return (
    <div className="grid gap-10">
      {group(T.progT, (
        <ul className="grid gap-4">
          {skills.map((s, i) => (
            <li key={s.n} data-reveal style={{ animationDelay: i * 90 + "ms" }}>
              <div className="mb-1.5 flex justify-between text-sm font-semibold"><span>{s.n}</span><span className="text-ac">{s.v}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-fg/10"><div className="bar h-full rounded-full" style={{ "--w": s.v + "%" }} /></div>
            </li>
          ))}
        </ul>
      ), 0)}
      {group(T.proT, <FloatChips items={T.pro} variant="pro" />, 1)}
      {group(T.perT, <FloatChips items={T.per} variant="per" />, 2)}
      {group(T.langT, <p className="font-semibold">{T.lang}</p>, 3)}
    </div>
  );
}

// PDF харагч: iframe-ээр үзэх, татах, шинэ цонхонд нээх
function PdfModal({ doc, T, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={doc.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="flex h-full max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-fg/15 bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 border-b border-fg/10 bg-pn/60 px-4 py-3">
          <b className="mr-auto min-w-0 flex-1 truncate font-display text-lg">{doc.title}</b>
          <a className={ghost + " !px-4 !py-1.5 text-sm"} href={doc.file} target="_blank" rel="noopener">{T.cvOpen} ↗</a>
          <a className={solid + " !px-4 !py-1.5 text-sm"} href={doc.file} download>{T.pdfDl} ↓</a>
          <button className={btn} onClick={onClose} aria-label={T.close}>✕</button>
        </div>
        <iframe title={doc.title} src={doc.file + "#view=FitH"} className="w-full flex-1 bg-white" />
        <p className="border-t border-fg/10 px-4 py-2 text-xs opacity-70">{T.pdfFail}</p>
      </div>
    </div>
  );
}

function Projects({ T, open }) {
  return (
    <div className="grid gap-10">
      {T.pr.map((q, i) => (
        <article key={q.n} data-reveal={i % 2 ? "right" : "left"} className={glass + " " + lift + " overflow-hidden"}>
          {q.img && <img src={q.img} alt="" className="aspect-video w-full border-b border-fg/10 object-cover" />}
          <div className="p-6">
            <span className="inline-block rounded-full border border-ac/40 bg-ac/10 px-3 py-0.5 text-xs font-semibold text-ac">{q.k}</span>
            <h3 className="mt-3 font-display text-2xl font-bold leading-snug tracking-tight">{q.n}</h3>
            <p className="my-3 opacity-85">{q.d}</p>
            <ul className="mb-5 flex flex-wrap gap-2">{q.tags.map((t) => <li key={t} className="rounded-full bg-fg/5 px-2.5 py-0.5 text-xs font-semibold text-ac">#{t}</li>)}</ul>
            <div className="flex flex-wrap gap-3">
              {q.pdf && <>
                <button className={solid} onClick={() => open({ file: q.pdf, title: q.n })}>{T.pdfView} →</button>
                <a className={ghost} href={q.pdf} download>{T.pdfDl} ↓</a>
              </>}
              {q.u && <a className={solid} href={q.u} target="_blank" rel="noopener">{T.site} ↗</a>}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Awards({ T }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {T.awards.map((a, i) => (
        <li key={a.t} data-reveal style={{ animationDelay: i * 120 + "ms" }}
          className={glass + " " + lift + " group relative overflow-hidden p-6"}>
          <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-4 font-display text-7xl font-extrabold text-ac/15 transition group-hover:text-ac/30">{a.y}</span>
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ac/40 bg-ac/10 px-3 py-0.5 text-sm font-semibold text-ac"><span aria-hidden="true">★</span>{a.r}</div>
            <p className="font-display text-xl font-bold leading-snug tracking-tight">{a.t}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Contact({ T }) {
  const rows = [
    [T.mail, data.email, "mailto:" + data.email],
    [T.phone, data.phone, "tel:+976" + data.phone],
    ["LinkedIn", "linkedin.com/in/moogii-moogii-70352a451", data.linkedin],
    ["GitHub", "github.com/Muugii70", data.github],
  ];
  return (
    <ul className="grid gap-3">
      {rows.map(([k, v, h], i) => (
        <li key={k} data-reveal style={{ animationDelay: i * 100 + "ms" }}>
          <a href={h} target={h.startsWith("http") ? "_blank" : undefined} rel="noopener"
            className={glass + " " + lift + " flex justify-between gap-3 px-5 py-3.5"}>
            <span className="opacity-70">{k}</span>
            <span className="break-all text-right font-semibold text-ac">{v}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  const [lang, setLang] = useState("mn");
  const [theme, setTheme] = useState("dark");
  const [doc, setDoc] = useState(null);
  const io = useRef(null);
  const T = data[lang], mn = lang === "mn";

  // layout effect: HeroChart өнгөө уншихаас өмнө data-theme тавигдсан байх ёстой
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Дэлгэцэнд ороход .in нэмж анимэйшн тоглуулна. Бүрэн гарахад хасна, тиймээс дээш доош гүйлгэх бүрт дахин тоглоно
  useEffect(() => {
    const enter = new IntersectionObserver((es) => es.forEach((e) => {
      const t = e.target;
      if (!e.isIntersecting || t.classList.contains("in")) return;
      t.dataset.from = e.boundingClientRect.bottom < innerHeight * 0.5 ? "top" : "bottom";
      t.classList.add("in");
    }), { rootMargin: "-10% 0px -10% 0px" });
    const leave = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) e.target.classList.remove("in");
    }));
    io.current = { enter, leave };
    return () => { enter.disconnect(); leave.disconnect(); };
  }, []);

  useEffect(() => {
    document.querySelectorAll("[data-reveal]").forEach((n) => {
      io.current.enter.observe(n);
      io.current.leave.observe(n);
    });
  });

  const nav = [["about", T.aboutT], ["career", mn ? "Товч намтар" : "Career"], ["projects", T.works]];

  return (
    <div className="min-h-dvh font-sans text-[15px] leading-relaxed text-fg">
      <GrowthLine lang={lang} />

      <header className="sticky top-[max(0.75rem,env(safe-area-inset-top))] z-30 mx-3 mt-3 flex items-center gap-2 rounded-full border border-fg/10 bg-bg/60 px-4 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,.4)] backdrop-blur-xl sm:gap-3 sm:px-5 sm:py-2.5 md:mx-auto md:max-w-5xl">
  <div className="flex flex-1 items-center">
    <b className="shrink-0 whitespace-nowrap font-display text-base tracking-tight sm:text-lg">{T.name}</b>
  </div>
  <nav className="hidden gap-8 text-sm lg:mx-10 lg:flex xl:gap-12">
    {nav.map(([id, label]) => <a key={id} href={"#" + id} className="whitespace-nowrap text-fg/70 transition hover:text-ac">{label}</a>)}
  </nav>
  <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
    <button className={btn + " font-semibold"} onClick={() => setDoc({ file: data.cv.file, title: "CV" })}>CV</button>
    <button className={btn} onClick={() => setLang(mn ? "en" : "mn")} aria-label="Language">{mn ? "EN" : "МН"}</button>
    <button className={btn} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Theme">◐</button>
  </div>
</header>

      <main>
        {/* Нээлт */}
        <section className="relative flex min-h-[88vh] items-center overflow-hidden py-10">
          <div className="absolute inset-0"><HeroChart theme={theme} /></div>
          <div className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-10 px-5 md:grid-cols-[1fr_auto] md:pl-16">
            <div className="text-center">
              <h1 key={lang + "n"} className="rise bg-gradient-to-r from-fg via-ac to-gold bg-clip-text font-display text-4xl font-extrabold leading-tight tracking-tight text-transparent sm:text-6xl">{T.hello}</h1>
              <p key={lang + "r"} className="rise mt-5 inline-block rounded-full border border-ac/40 bg-ac/10 px-4 py-1.5 text-sm font-semibold text-ac" style={{ animationDelay: ".12s" }}>{T.role}</p>
              <div className="rise mt-8 flex flex-wrap justify-center gap-3" style={{ animationDelay: ".3s" }}>
                <button className={solid} onClick={() => setDoc({ file: data.cv.file, title: "CV" })}>{T.cvView}</button>
                <a className={ghost} href={data.cv.file} download>{T.cvDl} ↓</a>
              </div>
              <p className="mt-12 animate-bounce text-sm opacity-70">{mn ? "Доош гүйлгээрэй" : "Scroll down"} ↓</p>
            </div>

            <div className="rise order-first justify-self-center md:order-last" style={{ animationDelay: ".2s" }}>
              <div className="float-chip" style={{ "--d": "6s", "--dx": "0px", "--dy": "-10px", "--r": "0deg" }}>
                <img src="/img/me.jpg" alt={T.name} width="446" height="1244"
                  className="h-[46vh] max-h-[560px] w-auto rounded-3xl border border-fg/15 bg-black shadow-[0_30px_80px_-30px_var(--color-ac)] md:h-[62vh]" />
              </div>
            </div>
          </div>
        </section>

        <Chapter id="about" title={T.aboutT}>
          <p data-reveal className="text-lg">{T.about}</p>
          <p data-reveal className="mt-4 opacity-80" style={{ animationDelay: "120ms" }}>{T.hobby}</p>
        </Chapter>

        <Chapter id="career" title={T.careerT}><Timeline T={T} mn={mn} /></Chapter>
        <Chapter id="skills" title={T.skillsT}><Skills T={T} skills={data.skills} /></Chapter>
        <Chapter id="projects" title={T.works}><Projects T={T} open={setDoc} /></Chapter>
        <Chapter id="awards" title={T.awardsT}><Awards T={T} /></Chapter>

        <Chapter id="contact" title={T.contactT}>
          <p data-reveal className="mb-5 text-lg">{T.msg}</p>
          <Contact T={T} />
        </Chapter>
      </main>

      {doc && <PdfModal doc={doc} T={T} onClose={() => setDoc(null)} />}

      <footer className="px-5 py-10 text-center text-sm opacity-70 md:pl-16">© 2026 · {T.name}</footer>
    </div>
  );
}