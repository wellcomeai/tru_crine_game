import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { ChevronDown } from 'lucide-react';

/* ─────────────────────── CONSTANTS ─────────────────────── */
const GOLD = '#d4a546';
const GOLD_DIM = '#a07830';
const GOLD_BRIGHT = '#f0d060';

const R2 = 'https://pub-b1e3de631e544c69b0ad6587f740e140.r2.dev';

const LOCATIONS = [
  `${R2}/location1.png`,
  `${R2}/location2.png`,
  `${R2}/location3.png`,
  `${R2}/location5.png`,
  `${R2}/location7.png`,
  `${R2}/location8.png`,
];

/* ═══════════════════════ TYPEWRITER ═══════════════════════ */
function useTypewriter(text: string, speed = 55, startDelay = 0, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(delayTimer);
  }, [text, speed, startDelay, enabled]);

  return { displayed, done };
}

/* ═══════════════════════ ANIMATED COUNTER ═══════════════════════ */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════ FLOATING PARTICLES ═══════════════════════ */
function FloatingParticles() {
  const particles = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.25 + 0.05,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: GOLD,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 30 - 15, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════ SCROLL REVEAL ═══════════════════════ */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════ EMOTION BADGES ═══════════════════════ */
const EMOTIONS = [
  { label: 'Спокоен', color: '#4a9e6d', bg: 'rgba(74,158,109,0.12)' },
  { label: 'Нервничает', color: '#c9a84c', bg: 'rgba(201,168,76,0.12)' },
  { label: 'Злится', color: '#cc3700', bg: 'rgba(204,55,0,0.12)' },
  { label: 'Боится', color: '#7b68ee', bg: 'rgba(123,104,238,0.12)' },
  { label: 'Врёт', color: '#e84040', bg: 'rgba(232,64,64,0.12)' },
];

function EmotionCycler() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % EMOTIONS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {EMOTIONS.map((e, i) => (
        <motion.span
          key={e.label}
          animate={{
            scale: i === idx ? 1.1 : 1,
            opacity: i === idx ? 1 : 0.4,
          }}
          transition={{ duration: 0.4 }}
          className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
          style={{
            color: e.color,
            backgroundColor: i === idx ? e.bg : 'transparent',
            borderColor: i === idx ? e.color + '40' : 'rgba(255,255,255,0.08)',
          }}
        >
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
            style={{ backgroundColor: e.color }}
            animate={i === idx ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          {e.label}
        </motion.span>
      ))}
    </div>
  );
}

/* ═══════════════════════ FAQ ACCORDION ═══════════════════════ */
const FAQ_ITEMS = [
  {
    q: 'Это бесплатно?',
    a: 'Первое дело — полностью бесплатно. Вы можете пройти его целиком, включая все допросы, осмотр локаций и финальное обвинение. Дополнительные дела доступны после покупки.',
  },
  {
    q: 'Нужен ли микрофон?',
    a: 'Нет. Вы общаетесь с подозреваемыми через текстовый ввод — печатаете вопросы и получаете ответы в реальном времени. Микрофон не требуется.',
  },
  {
    q: 'Сколько длится одно дело?',
    a: 'В среднем одно расследование занимает от 40 минут до 1,5 часов, в зависимости от того, насколько тщательно вы изучаете улики и допрашиваете подозреваемых.',
  },
  {
    q: 'Как работает AI в игре?',
    a: 'Каждый подозреваемый управляется продвинутым AI с уникальной личностью, секретами и алиби. Он реагирует на ваши вопросы и предъявленные улики, может нервничать, злиться и быть пойман на лжи.',
  },
  {
    q: 'Можно ли переиграть дело?',
    a: 'Да, вы можете начать расследование заново. AI генерирует уникальные ответы каждый раз, так что диалоги не будут повторяться.',
  },
];

function FaqItem({ item, isOpen, onToggle }: { item: typeof FAQ_ITEMS[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className="border-b transition-colors"
      style={{ borderColor: isOpen ? `${GOLD}30` : 'rgba(255,255,255,0.06)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span
          className="text-base sm:text-lg font-medium transition-colors"
          style={{ color: isOpen ? GOLD : '#c8c8d0', fontFamily: "'Playfair Display', serif" }}
        >
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown size={20} style={{ color: isOpen ? GOLD : '#666' }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p
              className="pb-5 text-sm sm:text-base leading-relaxed"
              style={{ color: '#8a8a9a', fontFamily: "'Source Sans 3', sans-serif" }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ MONITOR FRAME ═══════════════════════ */
function MonitorFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl overflow-hidden border relative group"
      style={{
        backgroundColor: '#111116',
        borderColor: 'rgba(255,255,255,0.08)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}30`;
        e.currentTarget.style.boxShadow = `0 50px 100px rgba(0,0,0,0.6), 0 0 60px ${GOLD}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = '0 40px 80px rgba(0,0,0,0.5)';
      }}
    >
      {/* Browser-like top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: '#0c0c10' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-5 rounded-md bg-white/[0.04] max-w-xs" />
        </div>
      </div>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full"
        style={{ display: 'block' }}
      />
    </motion.div>
  );
}

/* ═══════════════════════ LOCATIONS MARQUEE ═══════════════════════ */
function LocationsMarquee() {
  // Double the array for seamless loop
  const allSlides = [...LOCATIONS, ...LOCATIONS];

  return (
    <div className="w-full overflow-hidden relative">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #060608, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #060608, transparent)' }} />

      <div className="marquee-track-slow flex gap-5">
        {allSlides.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[420px] sm:w-[500px] aspect-video rounded-lg overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <img
              src={src}
              alt={`Локация ${(i % LOCATIONS.length) + 1}`}
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.85) saturate(0.9)' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function PublicLandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 1.08]);

  useEffect(() => {
    if (isAuthenticated) navigate('/cases', { replace: true });
  }, [isAuthenticated, navigate]);

  const tagline = 'Каждый подозреваемый лжёт. Каждая улика — ключ к истине.';
  const { displayed: typedTagline, done: taglineDone } = useTypewriter(tagline, 40, 1200);

  const goAuth = useCallback(() => navigate('/auth'), [navigate]);

  return (
    <div
      className="min-h-screen text-gray-200 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200"
      style={{
        background: 'radial-gradient(ellipse 120% 80% at 50% 10%, #1a1610 0%, #0a090c 40%, #060608 100%)',
        fontFamily: "'Source Sans 3', sans-serif",
      }}
    >

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ opacity: heroOpacity, scale: heroScale }}>
          {/* Atmospheric layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(212,165,70,0.04)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.6)_100%)]" />
          <FloatingParticles />

          {/* Film grain */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>

        {/* Detective portrait — right side */}
        <div className="absolute right-0 top-0 bottom-0 w-[55%] hidden lg:block pointer-events-none">
          <img
            src={`${R2}/photo_2026-02-16_12-23-44.jpg`}
            alt="Detective"
            className="absolute inset-0 w-full h-full object-cover object-top"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 90%), linear-gradient(to bottom, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.4) 90%)',
              WebkitMaskComposite: 'source-in',
              filter: 'contrast(1.1) saturate(0.85) sepia(0.15)',
              opacity: 0.8,
            }}
          />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#060608] to-transparent" />
        </div>

        {/* Mobile bg detective (faded) */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <img
            src={`${R2}/photo_2026-02-16_12-23-44.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top opacity-20"
            style={{ filter: 'blur(2px) contrast(1.1) saturate(0.7)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Beta badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border"
                style={{ color: GOLD_DIM, borderColor: `${GOLD_DIM}30`, backgroundColor: `${GOLD}06` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GOLD }} />
                Бета · Дело №001
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <span
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: '#e8e6e3',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                СТАНЬ
              </span>
              <span
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mt-1"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD}, ${GOLD_DIM})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: 'none',
                }}
              >
                ДЕТЕКТИВОМ
              </span>
            </motion.h1>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              className="h-px w-24 sm:w-36 origin-left mb-6"
              style={{ background: `linear-gradient(90deg, ${GOLD}80, transparent)` }}
            />

            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mb-8 min-h-[3rem]"
            >
              <p className="text-base sm:text-lg md:text-xl" style={{ color: '#8a8a9a', fontWeight: 300 }}>
                {typedTagline}
                {!taglineDone && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="inline-block w-[2px] h-5 ml-0.5 align-text-bottom"
                    style={{ backgroundColor: GOLD }}
                  />
                )}
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5 }}
              className="text-base sm:text-lg mb-10 max-w-md leading-relaxed"
              style={{ color: '#7a7a88', fontWeight: 300 }}
            >
              Допрашивай AI-подозреваемых, собирай улики на интерактивной доске и раскрой дело, которое поставило полицию в тупик.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <motion.button
                onClick={goAuth}
                whileHover={{ scale: 1.04, boxShadow: `0 0 50px ${GOLD}25` }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 text-base sm:text-lg font-semibold rounded-lg relative overflow-hidden group"
                style={{ backgroundColor: GOLD, color: '#0a0a0f' }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                <span className="relative">Начать расследование</span>
              </motion.button>

              <motion.button
                onClick={() => document.getElementById('interrogation')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3.5 text-base font-medium rounded-lg border transition-all duration-300"
                style={{ borderColor: `${GOLD}25`, color: GOLD_DIM }}
              >
                Смотреть демо
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-600">Прокрутите</span>
          <div className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center p-1">
            <motion.div
              className="w-1 h-1.5 rounded-full"
              style={{ backgroundColor: GOLD_DIM }}
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ═══════════ INTERROGATION FEATURE ═══════════ */}
      <section id="interrogation" className="relative py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="max-w-2xl mb-8">
              <span
                className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4"
                style={{ color: GOLD_DIM }}
              >
                Живой допрос
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
              >
                Подозреваемые, которые{' '}
                <span style={{ color: GOLD }}>лгут</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-6" style={{ fontWeight: 300 }}>
                Забудьте о заранее прописанных ответах. Каждый персонаж — уникальная AI-личность с тайнами, алиби и мотивами. Они нервничают, пытаются сменить тему и могут быть пойманы на противоречиях.
              </p>
            </div>
          </ScrollReveal>

          {/* Emotion badges */}
          <ScrollReveal delay={0.15} className="mb-6">
            <EmotionCycler />
          </ScrollReveal>

          {/* Tech tags */}
          <ScrollReveal delay={0.2} className="mb-10">
            <div className="flex flex-wrap gap-2">
              {['Голосовой ввод', 'Система эмоций', 'Психологический портрет', 'Предъявление улик'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs border"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#b0b0b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          {/* Large screenshot */}
          <ScrollReveal delay={0.3}>
            <MonitorFrame src={`${R2}/dopros.png`} alt="Интерфейс допроса подозреваемого" />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ MICRO CTA ═══════════ */}
      <section className="py-10 px-6">
        <ScrollReveal className="text-center">
          <motion.button
            onClick={goAuth}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-3 text-sm font-semibold rounded-lg border transition-all duration-300 group"
            style={{ borderColor: `${GOLD}40`, color: GOLD }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${GOLD}12`;
              e.currentTarget.style.boxShadow = `0 0 30px ${GOLD}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Попробовать бесплатно →
          </motion.button>
        </ScrollReveal>
      </section>

      {/* ═══════════ BOARD FEATURE ═══════════ */}
      <section className="relative py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="max-w-2xl mb-8">
              <span
                className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4"
                style={{ color: GOLD_DIM }}
              >
                Дедукция
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
              >
                Собирай картину{' '}
                <span style={{ color: GOLD }}>преступления</span>
              </h2>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-6" style={{ fontWeight: 300 }}>
                Все найденные улики и показания попадают на интерактивную доску. Связывайте факты красными нитями, стройте теории и отделяйте ложь от истины.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15} className="mb-10">
            <div className="flex flex-wrap gap-2">
              {['Drag & Drop', 'Валидация связей', 'Архив улик', 'Красные нити'].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-full text-xs border"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#b0b0b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <MonitorFrame src={`${R2}/doska.png`} alt="Интерактивная доска улик" />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ LOCATIONS ═══════════ */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <ScrollReveal className="text-center">
            <span
              className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4"
              style={{ color: GOLD_DIM }}
            >
              Атмосфера
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              Исследуй места{' '}
              <span style={{ color: GOLD }}>преступлений</span>
            </h2>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <LocationsMarquee />
        </ScrollReveal>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="relative py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-14 sm:mb-20">
            <span
              className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4"
              style={{ color: GOLD_DIM }}
            >
              Процесс расследования
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              Четыре шага до{' '}
              <span style={{ color: GOLD }}>истины</span>
            </h2>
          </ScrollReveal>

          {/* Timeline */}
          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line */}
            <div
              className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-px hidden sm:block"
              style={{ background: `linear-gradient(to bottom, transparent, ${GOLD}20, ${GOLD}20, transparent)` }}
            />

            {[
              {
                num: '01',
                title: 'Осмотр локаций',
                desc: 'Исследуйте фотореалистичные сцены преступления. Кликайте на объекты, находите скрытые улики. Каждая мелочь может стать ключом к разгадке.',
                icon: '🔍',
                detail: 'Интерактивные точки с динамическим обнаружением улик',
              },
              {
                num: '02',
                title: 'Допросы AI',
                desc: 'Каждый подозреваемый — уникальная AI-личность. Они лгут, нервничают, путаются в показаниях. Предъявляйте улики и наблюдайте за реакцией.',
                icon: '🎙️',
                detail: 'AI с системой эмоций и скрытых секретов',
              },
              {
                num: '03',
                title: 'Доска улик',
                desc: 'Связывайте доказательства между собой на интерактивной доске. Система подтвердит верные связи и поможет увидеть полную картину.',
                icon: '📋',
                detail: 'Граф связей с подтверждением версий',
              },
              {
                num: '04',
                title: 'Обвинение',
                desc: 'Назовите убийцу, мотив и метод. Подкрепите версию уликами. Система оценит расследование — до 1050 баллов за идеальное раскрытие.',
                icon: '⚖️',
                detail: 'Многокритериальная оценка с детальным разбором',
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.12}>
                <div className={`relative flex items-start gap-6 sm:gap-12 mb-14 sm:mb-18 ${
                  i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}>
                  {/* Number */}
                  <div className="flex-shrink-0 relative z-10 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-lg font-bold border-2"
                      style={{
                        borderColor: `${GOLD}35`,
                        backgroundColor: '#0a0a0f',
                        color: GOLD,
                        fontFamily: "'Playfair Display', serif",
                        boxShadow: `0 0 30px ${GOLD}08`,
                      }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'sm:pr-20 sm:text-right' : 'sm:pl-20 sm:text-left'}`}>
                    <div className="text-2xl sm:text-3xl mb-2">{step.icon}</div>
                    <h3
                      className="text-xl sm:text-2xl font-bold mb-3"
                      style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mb-3 max-w-md">
                      {step.desc}
                    </p>
                    <span
                      className="inline-block text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border"
                      style={{ color: GOLD_DIM, borderColor: `${GOLD}12`, backgroundColor: `${GOLD}04` }}
                    >
                      {step.detail}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SCORING ═══════════ */}
      <section className="relative py-20 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: GOLD_DIM }}>
              Система оценки
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              До{' '}
              <span style={{ color: GOLD }}>1050</span>{' '}
              баллов
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Верный подозреваемый', score: 500, max: 500, color: GOLD },
              { label: 'Точный мотив', score: 200, max: 200, color: '#c9a84c' },
              { label: 'Верный метод', score: 150, max: 150, color: '#a07830' },
              { label: 'Ключевые улики', score: 150, max: 150, color: '#8a7333' },
              { label: 'Бонус за мастерство', score: 50, max: 50, color: GOLD_BRIGHT },
            ].map((item, i) => (
              <ScrollReveal
                key={item.label}
                delay={i * 0.1}
                className={i === 4 ? 'sm:col-span-2 sm:max-w-sm sm:mx-auto sm:w-full' : ''}
              >
                <div
                  className="rounded-xl border p-5"
                  style={{ backgroundColor: 'rgba(10,10,15,0.5)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-300">{item.label}</span>
                    <span className="text-lg font-bold" style={{ color: item.color, fontFamily: "'Playfair Display', serif" }}>
                      {item.score}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(item.score / item.max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF ═══════════ */}
      <section className="py-12 px-6">
        <ScrollReveal className="text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['#c9a84c', '#8b5cf6', '#3b82f6', '#10b981'].map((c, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: c + '20', borderColor: '#0a0a0f', color: c }}
                >
                  {['АК', 'МВ', 'ДС', 'ИП'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              Уже{' '}
              <span style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                <AnimatedCounter target={847} duration={2500} />
              </span>{' '}
              детективов начали расследование
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="relative py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: GOLD_DIM }}>
              Вопросы
            </span>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              Частые вопросы
            </h2>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div>
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem
                  key={i}
                  item={item}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-28 sm:py-36 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,_rgba(212,165,70,0.04)_0%,_transparent_70%)]" />

        <ScrollReveal>
          <div className="relative z-10 max-w-2xl mx-auto">
            <span
              className="inline-block text-[10px] uppercase tracking-[0.35em] mb-6"
              style={{ color: GOLD_DIM }}
            >
              Первое дело — бесплатно
            </span>

            <h2
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              Истина ждёт<span style={{ color: GOLD }}>.</span>
            </h2>

            <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto" style={{ fontWeight: 300 }}>
              Сколько тайн сможете раскрыть?
            </p>

            <motion.button
              onClick={goAuth}
              whileHover={{ scale: 1.04, boxShadow: `0 0 60px ${GOLD}25` }}
              whileTap={{ scale: 0.97 }}
              className="px-10 py-4 text-lg font-semibold rounded-lg relative overflow-hidden group"
              style={{ backgroundColor: GOLD, color: '#0a0a0f' }}
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">Начать расследование</span>
            </motion.button>

            <p className="mt-6 text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                onClick={goAuth}
                className="underline underline-offset-2 transition-colors hover:text-gray-400"
              >
                Войти
              </button>
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-wider" style={{ fontFamily: "'Playfair Display', serif", color: GOLD_DIM }}>
            DETECTIVE AI
          </span>
          <span className="text-xs text-gray-700">
            Powered by AI · &copy; 2025–2026
          </span>
        </div>
      </footer>

      {/* ═══════════ GLOBAL STYLES ═══════════ */}
      <style>{`
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track-slow {
          animation: marquee-slow 90s linear infinite;
        }
      `}</style>
    </div>
  );
}
