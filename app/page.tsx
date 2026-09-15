"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Anton, JetBrains_Mono, Manrope } from "next/font/google";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

/* ================================================================== */
/*  FONTS                                                              */
/* ================================================================== */

const sans = Manrope({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "800"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const THEME = {
  paper: "#F7F4EE",
  ink: "#0F0D0B",
  heading: "#2A2724",
  amber: "#E8851F",
  night: "#0A1020",
  nightDeep: "#040710",
};

const CONFIG = {
  name: "Nazish Younas",
  day: 16,
  eyebrow: "Sixteenth · September 2026",
  subtitle:
    "Wishing you a year of good health, quiet joy, and everything you hope for.",
  wishes: [
    "Happy birthday, Miss. Wishing you a wonderful day.",
    "Wishing you a year full of happiness and good health.",
    "May this year bring you peace, joy, and everything you hope for.",
    "Wishing you a day as lovely as the kindness you share.",
    "May the year ahead be gentle, bright, and full of good things.",
    "Warmest wishes on your birthday. Have a lovely day.",
  ],
  credit: { label: "Made by", name: "Khizar" },
};

/* Precomputed embers */
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  startX: (Math.random() - 0.5) * 50,
  driftX: (Math.random() - 0.5) * 70,
  riseY: -90 - Math.random() * 160,
  size: 3 + Math.random() * 4,
  hue: ["#FFEFC0", "#FFD07A", "#F0A340", "#E8770E"][i % 4],
  duration: 1.6 + Math.random() * 1.2,
  delay: i * 0.06,
}));

/* ================================================================== */
/*  SLOW SCROLL HELPER                                                 */
/* ================================================================== */

function antScrollTo(targetY: number, duration: number) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, targetY);
    return;
  }
  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();
  const ease = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
  const step = (now: number) => {
    const t = Math.min(1, (now - startTime) / duration);
    window.scrollTo(0, startY + distance * ease(t));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ================================================================== */
/*  ROLLING DIGIT                                                      */
/* ================================================================== */

function Digit({
  value,
  isFastRoll,
}: {
  value: number;
  isFastRoll: boolean;
}) {
  const duration = isFastRoll ? 0.075 : 0.38;
  const ease = isFastRoll ? "linear" : EASE;

  return (
    <span
      className="relative inline-block overflow-hidden align-top"
      style={{ width: "0.55em", height: "1.05em", contain: "paint" }}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration, ease }}
          style={{ willChange: "transform" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ================================================================== */
/*  COUNTDOWN OVERLAY                                                  */
/* ================================================================== */

type Phase =
  | "rolling"
  | "landing"
  | "zoom"
  | "burning"
  | "settling"
  | "dissolving"
  | "postWait"
  | "rising";

const TIMING: Record<Phase, number> = {
  rolling: 3200,
  landing: 600,
  zoom: 1100,
  burning: 2400,
  settling: 600,
  dissolving: 1600,
  postWait: 400,
  rising: 1700,
};

const RANDOM_DURATION = 1500;
const SEQUENCE_HOLDS = [700, 800, 1000];

function CountdownOverlay({ onComplete }: { onComplete: () => void }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("rolling");
  const [rollValue, setRollValue] = useState<number>(11);
  const [rollStage, setRollStage] = useState<1 | 2>(1);
  const finishedRef = useRef(false);

  /* ---- Motion values ---- */
  const burnMV = useMotionValue(0);
  const dissolveMV = useMotionValue(0);

  /* ---- All useTransform hoisted, unconditional ---- */

  /* Fire reveal mask — bright fire sweeps from bottom up */
  const fireMask = useTransform(burnMV, (v) => {
    const p = v * 130;
    return `linear-gradient(to top, black ${p}%, transparent ${Math.min(
      p + 14,
      160,
    )}%)`;
  });

  /* Charred mask — dark layer revealed just below the fire edge */
  const charredMask = useTransform(burnMV, (v) => {
    const p = v * 130;
    return `linear-gradient(to top, black ${Math.max(
      p - 4,
      0,
    )}%, transparent ${Math.max(p - 2, 0)}%)`;
  });

  /* Dissolve mask — wipes the whole thing from bottom up */
  const dissolveMask = useTransform(dissolveMV, (v) => {
    const p = v * 185;
    return `linear-gradient(to top, transparent ${p}%, black ${Math.min(
      p + 55,
      250,
    )}%)`;
  });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!reduce) return;
    const t = window.setTimeout(finish, 300);
    return () => window.clearTimeout(t);
  }, [reduce, finish]);

  /* phase chain */
  useEffect(() => {
    if (reduce) return;
    const order: Phase[] = [
      "rolling",
      "landing",
      "zoom",
      "burning",
      "settling",
      "dissolving",
      "postWait",
      "rising",
    ];
    const idx = order.indexOf(phase);
    if (idx === -1 || idx === order.length - 1) return;
    const t = window.setTimeout(() => setPhase(order[idx + 1]), TIMING[phase]);
    return () => window.clearTimeout(t);
  }, [phase, reduce]);

  /* rolling driver */
  useEffect(() => {
    if (reduce || phase !== "rolling") return;
    let cancelled = false;
    let timeoutId: number | undefined;
    const start = performance.now();

    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;

      if (elapsed < RANDOM_DURATION) {
        setRollValue(11 + Math.floor(Math.random() * 17));
        const progress = elapsed / RANDOM_DURATION;
        const interval = 75 + progress * 85;
        timeoutId = window.setTimeout(tick, interval);
        return;
      }

      if (rollStage !== 2) setRollStage(2);

      const stageElapsed = elapsed - RANDOM_DURATION;
      const hold13 = SEQUENCE_HOLDS[0];
      const hold14 = hold13 + SEQUENCE_HOLDS[1];
      const hold15 = hold14 + SEQUENCE_HOLDS[2];

      if (stageElapsed < hold13) {
        setRollValue(13);
        timeoutId = window.setTimeout(tick, 60);
        return;
      }
      if (stageElapsed < hold14) {
        setRollValue(14);
        timeoutId = window.setTimeout(tick, 60);
        return;
      }
      if (stageElapsed < hold15) {
        setRollValue(15);
        timeoutId = window.setTimeout(tick, 60);
        return;
      }

      setRollValue(16);
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, phase]);

  /* burn driver */
  useEffect(() => {
    if (reduce || phase !== "burning") return;
    let raf = 0;
    const start = performance.now();
    const DURATION = TIMING.burning;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = t * t * (3 - 2 * t);
      burnMV.set(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, phase, burnMV]);

  /* dissolve driver */
  useEffect(() => {
    if (reduce || phase !== "dissolving") return;
    let raf = 0;
    const start = performance.now();
    const DURATION = TIMING.dissolving;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 5);
      dissolveMV.set(eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, phase, dissolveMV]);

  useEffect(() => {
    if (phase !== "rising") return;
    const t = window.setTimeout(finish, TIMING.rising);
    return () => window.clearTimeout(t);
  }, [phase, finish]);

  if (reduce) return null;

  const glowing =
    phase === "landing" ||
    phase === "zoom" ||
    phase === "burning" ||
    phase === "settling" ||
    phase === "dissolving";
  const zoomed =
    phase === "zoom" ||
    phase === "burning" ||
    phase === "settling" ||
    phase === "dissolving";
  const burning =
    phase === "burning" ||
    phase === "settling" ||
    phase === "dissolving";
  const postWait = phase === "postWait";
  const rising = phase === "rising";

  const displayNumber = phase === "rolling" ? rollValue : CONFIG.day;
  const tens = Math.floor(displayNumber / 10);
  const units = displayNumber % 10;
  const isFastRoll = phase === "rolling" && rollStage === 1;

  const captionOpacity = rising || postWait ? 0 : 0.55;

  return (
    <motion.div
      animate={{ y: rising ? "-100%" : "0%" }}
      transition={
        rising
          ? { duration: TIMING.rising / 1000, ease: [0.7, 0, 0.3, 1] }
          : { duration: 0.4 }
      }
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at center, #16203B 0%, ${THEME.night} 45%, ${THEME.nightDeep} 100%)`,
        willChange: "transform",
        transform: "translateZ(0)",
      }}
      aria-hidden
    >
      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Warm glow */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: "75vmin",
          height: "75vmin",
          background:
            "radial-gradient(circle, rgba(255,245,220,0.35) 0%, rgba(200,215,255,0.12) 45%, transparent 72%)",
          willChange: "opacity, transform",
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          opacity: rising || postWait ? 0 : glowing ? 0.95 : 0.25,
          scale: zoomed ? 1.35 : 1,
        }}
        transition={{ duration: 0.9, ease: EASE }}
      />

      {/* Number stage */}
      <motion.div
        className="relative"
        animate={{ scale: zoomed ? 1.5 : 1 }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{
          width: "min(92vw, 560px)",
          height: "min(60vw, 380px)",
          willChange: "transform",
        }}
      >
        {/* Dissolve wrapper */}
        <motion.div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: dissolveMask,
            maskImage: dissolveMask,
          }}
        >
          {/* -------- White digits -------- */}
          <div
            className={`${anton.className} absolute inset-0 flex items-center justify-center leading-none select-none`}
            style={{
              fontSize: "clamp(11rem, 40vw, 22rem)",
              color: "#F4F1EC",
              textShadow: glowing
                ? "0 0 30px rgba(255,255,255,0.85), 0 0 80px rgba(190,210,255,0.5)"
                : "0 0 20px rgba(255,255,255,0.35)",
              transition: "text-shadow 0.6s ease",
            }}
          >
            <Digit value={tens} isFastRoll={isFastRoll} />
            <Digit value={units} isFastRoll={isFastRoll} />
          </div>

          {/* -------- Charred layer (revealed below fire edge) -------- */}
          {burning && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{
                WebkitMaskImage: charredMask,
                maskImage: charredMask,
              }}
            >
              <span
                className={`${anton.className} select-none leading-none`}
                style={{
                  fontSize: "clamp(11rem, 40vw, 22rem)",
                  color: "#5A1E0A",
                }}
              >
                {tens}
                {units}
              </span>
            </motion.div>
          )}

          {/* -------- Fire layer -------- */}
          {burning && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{
                WebkitMaskImage: fireMask,
                maskImage: fireMask,
              }}
            >
              <span
                className={`${anton.className} select-none leading-none`}
                style={{
                  fontSize: "clamp(11rem, 40vw, 22rem)",
                  color: "#FF8A1A",
                  textShadow:
                    "0 0 20px rgba(255,180,80,0.95), 0 0 50px rgba(255,120,40,0.7), 0 0 100px rgba(200,80,20,0.4)",
                }}
              >
                {tens}
                {units}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Embers */}
        {phase === "burning" &&
          EMBERS.map((e) => (
            <motion.span
              key={e.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${50 + e.startX}%`,
                bottom: "18%",
                width: e.size,
                height: e.size,
                backgroundColor: e.hue,
                willChange: "transform, opacity",
              }}
              initial={{ opacity: 0, x: 0, y: 20, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0.4, 0],
                x: e.driftX,
                y: e.riseY,
                scale: [0.5, 1.2, 1, 0.7, 0.2],
              }}
              transition={{
                duration: e.duration,
                delay: e.delay,
                ease: "easeOut",
              }}
            />
          ))}
      </motion.div>

      {/* Caption */}
      <motion.p
        animate={{ opacity: captionOpacity }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`${mono.className} absolute bottom-14 left-0 right-0 text-center text-[10px] uppercase tracking-[0.5em] text-white`}
      >
        {burning ? "New chapter" : "Counting down"}
      </motion.p>
    </motion.div>
  );
}

/* ================================================================== */
/*  HERO                                                               */
/* ================================================================== */

function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-20 sm:px-10 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[60vmin] w-[60vmin]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,133,31,0.14) 0%, rgba(232,133,31,0) 65%)",
        }}
      />

      <motion.span
        aria-hidden
        initial={reduce ? false : { opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
        className={`${anton.className} pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 select-none leading-none sm:right-0 lg:right-4`}
        style={{
          fontSize: "clamp(18rem, 52vw, 40rem)",
          letterSpacing: "-0.06em",
          backgroundImage:
            "linear-gradient(to bottom, rgba(15,13,11,0.14) 0%, rgba(15,13,11,0.06) 40%, rgba(15,13,11,0.01) 75%, rgba(15,13,11,0) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          zIndex: 0,
        }}
      >
        {CONFIG.day}
      </motion.span>

      <div className="relative z-10 w-full max-w-3xl">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className={`${mono.className} mb-6 text-[9px] uppercase tracking-[0.35em] text-[#0F0D0B]/55 sm:mb-9 sm:text-[13px] sm:tracking-[0.5em]`}
        >
          {CONFIG.eyebrow}
        </motion.p>

        <h1
          className={`${sans.className} leading-[0.9] tracking-[-0.04em]`}
          style={{ color: THEME.heading }}
        >
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
            className="block text-[clamp(3rem,14vw,8.5rem)] font-extralight"
          >
            Happy
          </motion.span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: EASE }}
            className="block text-[clamp(3rem,14vw,8.5rem)] font-extrabold"
          >
            Birthday
          </motion.span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.65, ease: EASE }}
            className="block text-[clamp(2.25rem,10vw,6rem)] font-extrabold"
            style={{ color: THEME.amber }}
          >
            {CONFIG.name}
          </motion.span>
        </h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1, ease: EASE }}
          className={`${sans.className} mt-10 max-w-sm text-[14px] font-light leading-[1.55] text-[#0F0D0B]/55 sm:text-[15px]`}
        >
          {CONFIG.subtitle}
        </motion.p>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6, ease: EASE }}
        className="absolute bottom-10 left-6 flex items-center gap-3 sm:left-10 lg:left-16"
      >
        <span
          className={`${mono.className} text-[9px] uppercase tracking-[0.4em] text-[#0F0D0B]/40 sm:text-[10px]`}
        >
          Scroll
        </span>
        <motion.span
          animate={
            reduce ? undefined : { x: [0, 6, 0], opacity: [0.35, 0.9, 0.35] }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="h-px w-8 bg-[#0F0D0B]/50 sm:w-10"
        />
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  WISHES SECTION                                                     */
/* ================================================================== */

function RevealLine({
  text,
  delay = 0,
  stagger = 0.05,
}: {
  text: string;
  delay?: number;
  stagger?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className="inline" aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="-mb-[0.22em] inline-block overflow-hidden pb-[0.22em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "110%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.9,
              delay: delay + i * stagger,
              ease: EASE,
            }}
          >
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function WishesSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="wishes"
      className="relative overflow-hidden px-6 pb-24 pt-24 sm:px-10 sm:pb-28 sm:pt-32 lg:px-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[60vmin] w-[60vmin]"
        style={{
          background:
            "radial-gradient(circle, rgba(232,133,31,0.12) 0%, rgba(232,133,31,0) 65%)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className={`${mono.className} mb-12 text-[9px] uppercase tracking-[0.4em] text-[#0F0D0B]/45 sm:mb-16 sm:text-[10px] sm:tracking-[0.5em]`}
        >
          A few wishes
        </motion.p>

        <ul className="space-y-10 sm:space-y-14">
          {CONFIG.wishes.map((wish, i) => (
            <li key={i} className="relative">
              <div className="flex items-start gap-5 sm:gap-8">
                <motion.span
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                  className={`${mono.className} mt-2 shrink-0 text-[10px] tabular-nums tracking-[0.2em] text-[#0F0D0B]/30 sm:text-[11px]`}
                >
                  {String(i + 1).padStart(2, "0")}
                </motion.span>

                <p
                  className={`${sans.className} text-[clamp(1.35rem,4.5vw,2.25rem)] font-light leading-[1.35] tracking-[-0.02em] text-[#2A2724]`}
                >
                  <RevealLine text={wish} delay={0.05} stagger={0.05} />
                </p>
              </div>

              {i < CONFIG.wishes.length - 1 && (
                <motion.div
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 1, delay: 0.35, ease: EASE }}
                  className="ml-10 mt-10 h-px origin-left bg-[#0F0D0B]/10 sm:ml-[52px] sm:mt-14"
                />
              )}
            </li>
          ))}
        </ul>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
          className="mt-20 flex flex-col items-center gap-5 sm:mt-28"
        >
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#0F0D0B]/20 sm:w-14" />
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#E8851F]"
              style={{ boxShadow: "0 0 12px rgba(232,133,31,0.55)" }}
            />
            <span className="h-px w-10 bg-[#0F0D0B]/20 sm:w-14" />
          </div>

          <p
            className={`${mono.className} text-[9px] uppercase tracking-[0.4em] text-[#0F0D0B]/40 sm:text-[10px] sm:tracking-[0.5em]`}
          >
            That&apos;s all
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================== */
/*  FOOTER                                                             */
/* ================================================================== */

function Footer() {
  const reduce = useReducedMotion();

  return (
    <footer className="relative px-6 pb-14 pt-8 sm:px-10 sm:pb-16 lg:px-16">
      <div className="mx-auto w-full max-w-2xl">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1, ease: EASE }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        >
          <p
            className={`${mono.className} text-[9px] uppercase tracking-[0.35em] text-[#0F0D0B]/40 sm:text-[10px]`}
          >
            {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-3">
            <span
              className={`${mono.className} text-[9px] uppercase tracking-[0.35em] text-[#0F0D0B]/40 sm:text-[10px]`}
            >
              {CONFIG.credit.label}
            </span>
            <span className="h-px w-6 bg-[#0F0D0B]/20" aria-hidden />
            <span
              className={`${sans.className} text-[13px] font-semibold tracking-[-0.01em] sm:text-[14px]`}
              style={{ color: THEME.amber }}
            >
              {CONFIG.credit.name}
            </span>
          </div>

          <p
            className={`${mono.className} text-[9px] uppercase tracking-[0.35em] text-[#0F0D0B]/40 sm:text-[10px]`}
          >
            Sept 2026
          </p>
        </motion.div>
      </div>
    </footer>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function Page() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleIntroComplete = useCallback(() => {
    if (typeof window === "undefined") return;
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
    document.body.style.overflow = "";
    setIntroDone(true);

    const wait = 3700;
    const nudgeTarget = Math.min(window.innerHeight * 0.32, 340);

    window.setTimeout(() => {
      antScrollTo(nudgeTarget, 2600);
    }, wait);
  }, []);

  return (
    <main
      className={`${sans.variable} ${mono.variable} ${anton.variable} relative antialiased`}
      style={{
        backgroundColor: THEME.paper,
        color: THEME.ink,
      }}
    >
      <Hero />
      <WishesSection />
      <Footer />

      <AnimatePresence>
        {!introDone && <CountdownOverlay onComplete={handleIntroComplete} />}
      </AnimatePresence>
    </main>
  );
}