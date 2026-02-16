import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

/* ─────────────────────── GOLD PALETTE ─────────────────────── */
const GOLD = '#d4a546';
const GOLD_DIM = '#a07830';
const GOLD_BRIGHT = '#f0d060';

/* ═══════════════════════ TYPEWRITER HOOK ═══════════════════════ */
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
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.05,
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
            y: [0, -120, 0],
            x: [0, Math.random() * 40 - 20, 0],
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

/* ═══════════════════════ NOIR LIGHT SWEEP ═══════════════════════ */
function LightSweep() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'conic-gradient(from 0deg at 30% 40%, transparent 0deg, rgba(212,165,70,0.03) 15deg, transparent 30deg)',
      }}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ═══════════════════════ ANIMATED DIALOGUE ═══════════════════════ */
const DIALOGUE_LINES = [
  { speaker: 'Детектив', text: 'Где вы были в ночь убийства?', isPlayer: true },
  { speaker: 'Мария Ковалёва', text: 'Дома... одна. Читала книгу.', isPlayer: false },
  { speaker: 'Детектив', text: 'Свидетели видели ваш автомобиль у особняка в 23:40.', isPlayer: true },
  { speaker: 'Мария Ковалёва', text: 'Это... это невозможно. Кто-то лжёт!', isPlayer: false },
  { speaker: 'Детектив', text: '[Предъявлена улика: Чек с АЗС]', isPlayer: true, isEvidence: true },
  { speaker: 'Мария Ковалёва', text: 'Ладно... Я была там. Но я не убивала его! Я приехала поговорить, а он уже...', isPlayer: false },
];

function LiveDialogue() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i > DIALOGUE_LINES.length) {
        clearInterval(timer);
      } else {
        setVisibleLines(i);
      }
    }, 1800);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div ref={ref} className="space-y-3 font-sans">
      <AnimatePresence>
        {DIALOGUE_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: line.isPlayer ? 20 : -20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`flex ${line.isPlayer ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${line.isPlayer ? 'order-2' : ''}`}>
              <span className={`text-[10px] uppercase tracking-wider block mb-1 ${
                line.isPlayer ? 'text-right' : 'text-left'
              }`} style={{ color: line.isPlayer ? GOLD_DIM : '#666' }}>
                {line.speaker}
              </span>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  line.isEvidence
                    ? 'bg-amber-900/20 border border-amber-700/30 text-amber-300 text-center rounded-xl text-xs'
                    : line.isPlayer
                    ? 'bg-amber-900/15 border border-amber-800/20 text-gray-200 rounded-br-md'
                    : 'bg-neutral-800/60 border border-neutral-700/30 text-gray-300 rounded-bl-md'
                }`}
              >
                {line.text}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      {visibleLines > 0 && visibleLines < DIALOGUE_LINES.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex ${DIALOGUE_LINES[visibleLines]?.isPlayer ? 'justify-end' : 'justify-start'}`}
        >
          <div className="flex gap-1 px-4 py-3 bg-neutral-800/40 rounded-2xl border border-neutral-700/20">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-gray-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-gray-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-gray-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════ EVIDENCE PIN ═══════════════════════ */
function EvidencePin({ label, x, y, delay = 0 }: { label: string; x: string; y: string; delay?: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="absolute cursor-pointer z-10"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: 'spring', stiffness: 200 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `1px solid ${GOLD}40` }}
        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Dot */}
      <div
        className="w-3 h-3 rounded-full border-2 shadow-lg"
        style={{
          backgroundColor: hovered ? GOLD : '#1a1a2e',
          borderColor: GOLD,
          boxShadow: `0 0 12px ${GOLD}40`,
        }}
      />
      {/* Label */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap"
          >
            <div className="bg-neutral-900/95 border border-neutral-700/50 text-gray-200 text-xs px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-sm">
              {label}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid rgba(64,64,80,0.5)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════ SCROLL SECTION ═══════════════════════ */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function PublicLandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  // Parallax transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.1]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, 80]);

  useEffect(() => {
    if (isAuthenticated) navigate('/cases', { replace: true });
  }, [isAuthenticated, navigate]);

  // Typewriter for tagline
  const tagline = 'Каждый подозреваемый лжёт. Каждая улика — ключ к истине.';
  const { displayed: typedTagline, done: taglineDone } = useTypewriter(tagline, 40, 1200);

  const goAuth = useCallback(() => navigate('/auth'), [navigate]);

  return (
    <div className="min-h-screen bg-[#060608] text-gray-200 overflow-x-hidden selection:bg-amber-500/20 selection:text-amber-200">

      {/* ═══════════ HERO ═══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Layered backgrounds */}
        <motion.div className="absolute inset-0" style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}>
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_#12100a_0%,_#060608_70%)]" />

          {/* Atmospheric fog layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(212,165,70,0.04)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(160,120,48,0.03)_0%,_transparent_40%)]" />

          {/* Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.7)_100%)]" />

          {/* Film grain overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            }}
          />

          <FloatingParticles />
          <LightSweep />
        </motion.div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* Case file number */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <span
              className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.35em] px-4 py-1.5 rounded-full border"
              style={{ color: GOLD_DIM, borderColor: `${GOLD_DIM}30` }}
            >
              Дело №001 · Секретно
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-2"
          >
            <span
              className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.85]"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: GOLD,
                textShadow: `0 0 80px ${GOLD}15, 0 2px 4px rgba(0,0,0,0.5)`,
              }}
            >
              DETECTIVE
            </span>
            <span
              className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-[0.2em] mt-1"
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                color: '#e8e6e3',
                fontWeight: 200,
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              AI
            </span>
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto my-6 h-px w-32 sm:w-48 origin-center"
            style={{ background: `linear-gradient(90deg, transparent, ${GOLD}60, transparent)` }}
          />

          {/* Typewriter tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="h-12 sm:h-8 flex items-center justify-center mb-10"
          >
            <p
              className="text-base sm:text-lg md:text-xl max-w-lg mx-auto"
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                color: '#8a8a9a',
                fontWeight: 300,
              }}
            >
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

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              onClick={goAuth}
              whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${GOLD}30` }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 relative overflow-hidden group"
              style={{ backgroundColor: GOLD, color: '#0a0a0f' }}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative">Начать расследование</span>
            </motion.button>

            <motion.button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 text-base font-medium rounded-lg border transition-all duration-300"
              style={{
                borderColor: `${GOLD}30`,
                color: GOLD_DIM,
              }}
            >
              Как это работает
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
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

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="relative py-8 sm:py-10 border-y" style={{ borderColor: '#ffffff06' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: 1050, suffix: '', label: 'Макс. баллов' },
            { value: 15, suffix: '+', label: 'AI-персонажей' },
            { value: 50, suffix: '+', label: 'Улик в деле' },
            { value: 100, suffix: '%', label: 'Уникальные диалоги' },
          ].map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1}>
              <div>
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD, fontFamily: "'Playfair Display', serif" }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-gray-600 mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-16 sm:mb-20">
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
          <div className="relative">
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
                detail: 'Интерактивные точки интереса с динамическим обнаружением улик',
              },
              {
                num: '02',
                title: 'Допросы AI',
                desc: 'Каждый подозреваемый — уникальная AI-личность. Они лгут, нервничают, путаются в показаниях. Предъявляйте улики и наблюдайте за реакцией.',
                icon: '🎙️',
                detail: 'GPT-4o с системой эмоций и скрытых секретов',
              },
              {
                num: '03',
                title: 'Доска улик',
                desc: 'Связывайте доказательства между собой на интерактивной доске. Система подтвердит верные связи и поможет увидеть полную картину преступления.',
                icon: '📋',
                detail: 'Drag & drop граф с подтверждением связей',
              },
              {
                num: '04',
                title: 'Обвинение',
                desc: 'Назовите убийцу, мотив и метод. Подкрепите версию уликами. Система оценит ваше расследование — до 1050 баллов за идеальное раскрытие.',
                icon: '⚖️',
                detail: 'Многокритериальная оценка с детальным разбором',
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.15}>
                <div className={`relative flex items-start gap-6 sm:gap-12 mb-16 sm:mb-20 ${
                  i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}>
                  {/* Number circle */}
                  <div className="flex-shrink-0 relative z-10 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold border-2"
                      style={{
                        borderColor: `${GOLD}40`,
                        backgroundColor: '#0a0a0f',
                        color: GOLD,
                        fontFamily: "'Playfair Display', serif",
                        boxShadow: `0 0 30px ${GOLD}10`,
                      }}
                    >
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'sm:pr-20 sm:text-right' : 'sm:pl-20 sm:text-left'}`}>
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <h3
                      className="text-xl sm:text-2xl font-bold mb-3"
                      style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mb-3 max-w-md" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                      {step.desc}
                    </p>
                    <span
                      className="inline-block text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border"
                      style={{ color: GOLD_DIM, borderColor: `${GOLD}15`, backgroundColor: `${GOLD}05` }}
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

      {/* ═══════════ LIVE INTERROGATION DEMO ═══════════ */}
      <section className="relative py-24 sm:py-32 px-6 overflow-hidden">
        {/* Background atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_rgba(212,165,70,0.03)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,_rgba(100,80,40,0.02)_0%,_transparent_50%)]" />

        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: GOLD_DIM }}>
              Живой допрос
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              AI, который{' '}
              <span style={{ color: GOLD }}>врёт</span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              Каждый персонаж — уникальная личность с тайнами, алиби и мотивами
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Dialogue panel */}
            <ScrollReveal delay={0.2}>
              <div
                className="rounded-2xl border p-6 backdrop-blur-sm relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(10,10,15,0.6)',
                  borderColor: '#ffffff08',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: '#ffffff08' }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD, fontFamily: "'Playfair Display', serif" }}
                    >
                      МК
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-200">Мария Ковалёва</div>
                      <div className="text-[11px] text-gray-600">Подозреваемая · Жена жертвы</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: '#c9a84c' }}
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: '#c9a84c' }}>Нервничает</span>
                  </div>
                </div>

                <LiveDialogue />
              </div>
            </ScrollReveal>

            {/* Feature cards */}
            <div className="space-y-4">
              {[
                {
                  title: 'Система эмоций',
                  desc: 'Персонажи реагируют на ваши вопросы и улики. Нервничают, злятся, пугаются — всё влияет на их ответы.',
                  color: '#c9a84c',
                },
                {
                  title: 'Скрытые секреты',
                  desc: 'У каждого есть тайны, которые они не хотят раскрывать. Правильные вопросы и улики заставят их говорить.',
                  color: '#cc3700',
                },
                {
                  title: 'Предъявление улик',
                  desc: 'Покажите подозреваемому найденную улику и наблюдайте за реакцией — ложь рассыплется на глазах.',
                  color: '#2d5a27',
                },
              ].map((feat, i) => (
                <ScrollReveal key={feat.title} delay={0.3 + i * 0.15}>
                  <div
                    className="rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: 'rgba(10,10,15,0.4)',
                      borderColor: `${feat.color}15`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${feat.color}40`;
                      e.currentTarget.style.boxShadow = `0 4px 30px ${feat.color}08`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${feat.color}15`;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: feat.color }}
                      />
                      <div>
                        <h4
                          className="font-semibold mb-1.5"
                          style={{ color: '#e8e6e3', fontFamily: "'Playfair Display', serif" }}
                        >
                          {feat.title}
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ INTERACTIVE CRIME SCENE PREVIEW ═══════════ */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <span className="inline-block text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: GOLD_DIM }}>
              Интерактивные сцены
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}
            >
              Место{' '}
              <span style={{ color: GOLD }}>преступления</span>
            </h2>
            <p className="text-gray-500 max-w-md mx-auto" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
              Наведите на точки, чтобы увидеть улики
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <div
              className="relative aspect-video rounded-2xl overflow-hidden border"
              style={{
                borderColor: '#ffffff08',
                background: 'linear-gradient(135deg, #0c0c14 0%, #1a1420 30%, #12100a 70%, #0a0a0f 100%)',
              }}
            >
              {/* Fake scene atmosphere */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,_rgba(180,140,50,0.06)_0%,_transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(139,37,0,0.04)_0%,_transparent_40%)]" />

              {/* Decorative room elements */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

              {/* "CRIME SCENE" tape */}
              <motion.div
                initial={{ x: '-100%' }}
                whileInView={{ x: '0%' }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-[15%] -left-2 -right-2 h-6 flex items-center -rotate-2 z-20"
                style={{ backgroundColor: 'rgba(212,165,70,0.85)' }}
              >
                <div className="flex gap-12 animate-marquee whitespace-nowrap text-[10px] font-bold tracking-[0.3em] text-black/70 uppercase">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i}>⚠ Место преступления — не пересекать ⚠</span>
                  ))}
                </div>
              </motion.div>

              {/* Evidence pins */}
              <EvidencePin label="📄 Записка с угрозами" x="25%" y="45%" delay={0.5} />
              <EvidencePin label="🔪 Нож с отпечатками" x="60%" y="65%" delay={0.8} />
              <EvidencePin label="📱 Разбитый телефон" x="75%" y="40%" delay={1.1} />
              <EvidencePin label="💊 Следы яда на стакане" x="40%" y="75%" delay={1.4} />
              <EvidencePin label="🔑 Ключ от сейфа" x="15%" y="70%" delay={1.7} />

              {/* Overlay grid */}
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════ SCORING SYSTEM ═══════════ */}
      <section className="relative py-24 sm:py-32 px-6">
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
                  style={{ backgroundColor: 'rgba(10,10,15,0.4)', borderColor: '#ffffff08' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-300" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
                      {item.label}
                    </span>
                    <span className="text-lg font-bold" style={{ color: item.color, fontFamily: "'Playfair Display', serif" }}>
                      {item.score}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
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

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-32 sm:py-40 px-6 text-center overflow-hidden">
        {/* Atmosphere */}
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

            <p className="text-lg text-gray-500 mb-10 max-w-md mx-auto" style={{ fontFamily: "'Source Sans 3', sans-serif", fontWeight: 300 }}>
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
      <footer className="border-t py-8 px-6" style={{ borderColor: '#ffffff06' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-wider" style={{ fontFamily: "'Playfair Display', serif", color: GOLD_DIM }}>
            DETECTIVE AI
          </span>
          <span className="text-xs text-gray-700">
            Powered by GPT-4o · &copy; 2025–2026
          </span>
        </div>
      </footer>

      {/* ═══════════ GLOBAL STYLES ═══════════ */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
