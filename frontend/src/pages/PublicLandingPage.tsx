import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { ChevronDown, Search, MessageSquare, Network, Scale } from 'lucide-react';

/* ─────────────────────── PALETTE ─────────────────────── */
const GOLD = '#d4a546';
const GOLD_DIM = '#a07830';
const GOLD_BRIGHT = '#f0d060';
const R2 = 'https://pub-b1e3de631e544c69b0ad6587f740e140.r2.dev';

const LOCATIONS = [
  `${R2}/location1.png`, `${R2}/location2.png`, `${R2}/location3.png`,
  `${R2}/location5.png`, `${R2}/location7.png`, `${R2}/location8.png`,
];

/* ═══════════════════ TYPEWRITER ═══════════════════ */
function useTypewriter(text: string, speed = 50, startDelay = 0, enabled = true) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        i++; setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [text, speed, startDelay, enabled]);
  return { displayed, done };
}

/* ═══════════════════ COUNTER ═══════════════════ */
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let s = 0;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const t = setInterval(() => {
      s += step;
      if (s >= target) { setValue(target); clearInterval(t); } else setValue(s);
    }, 16);
    return () => clearInterval(t);
  }, [inView, target, duration]);
  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════ PARTICLES ═══════════════════ */
function FloatingParticles() {
  const p = useRef(
    Array.from({ length: 25 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 2 + 0.5, dur: Math.random() * 25 + 15,
      delay: Math.random() * 12, opacity: Math.random() * 0.2 + 0.04,
    }))
  ).current;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {p.map((d) => (
        <motion.div key={d.id} className="absolute rounded-full"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, backgroundColor: GOLD, opacity: d.opacity }}
          animate={{ y: [0, -80, 0], x: [0, Math.random() * 20 - 10, 0], opacity: [d.opacity, d.opacity * 2.5, d.opacity] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════ SCROLL REVEAL ═══════════════════ */
function SR({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 35 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>{children}</motion.div>
  );
}

/* ═══════════════════ EMOTION BADGES ═══════════════════ */
const EMOTIONS = [
  { label: 'Спокоен', color: '#4a9e6d' }, { label: 'Нервничает', color: '#c9a84c' },
  { label: 'Злится', color: '#cc3700' }, { label: 'Боится', color: '#7b68ee' },
  { label: 'Врёт', color: '#e84040' },
];

function EmotionCycler() {
  const [idx, setIdx] = useState(0);
  useEffect(() => { const t = setInterval(() => setIdx(p => (p + 1) % EMOTIONS.length), 2000); return () => clearInterval(t); }, []);
  return (
    <div className="flex flex-wrap gap-2">
      {EMOTIONS.map((e, i) => (
        <motion.span key={e.label}
          animate={{ scale: i === idx ? 1.08 : 1, opacity: i === idx ? 1 : 0.35 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="px-3 py-1.5 rounded-full text-xs font-medium border inline-flex items-center gap-1.5"
          style={{
            color: e.color,
            backgroundColor: i === idx ? e.color + '14' : 'transparent',
            borderColor: i === idx ? e.color + '40' : 'rgba(255,255,255,0.06)',
          }}>
          <motion.span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }}
            animate={i === idx ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 0.8, repeat: Infinity }} />
          {e.label}
        </motion.span>
      ))}
    </div>
  );
}

/* ═══════════════════ FAQ ═══════════════════ */
const FAQ = [
  { q: 'Это бесплатно?', a: 'Первое дело — полностью бесплатно. Вы можете пройти его целиком, включая все допросы, осмотр локаций и финальное обвинение. Дополнительные дела доступны после покупки.' },
  { q: 'Нужен ли микрофон?', a: 'Нет. Вы общаетесь с подозреваемыми через текстовый ввод — печатаете вопросы и получаете ответы в реальном времени.' },
  { q: 'Сколько длится одно дело?', a: 'В среднем от 40 минут до 1,5 часов — зависит от того, насколько тщательно вы изучаете улики и допрашиваете подозреваемых.' },
  { q: 'Как работает AI в игре?', a: 'Каждый подозреваемый управляется продвинутым AI с уникальной личностью, секретами и алиби. Он реагирует на ваши вопросы и предъявленные улики, может нервничать, злиться и быть пойман на лжи.' },
  { q: 'Можно ли переиграть дело?', a: 'Да. AI генерирует уникальные ответы каждый раз, так что диалоги не будут повторяться.' },
];

function FaqItem({ item, isOpen, onToggle }: { item: typeof FAQ[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${isOpen ? GOLD + '25' : 'rgba(255,255,255,0.05)'}` }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between py-5 text-left group">
        <span className="text-base sm:text-lg font-medium transition-colors duration-300"
          style={{ color: isOpen ? GOLD : '#b8b8c0', fontFamily: "'Playfair Display', serif" }}>{item.q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }} className="ml-4 flex-shrink-0">
          <ChevronDown size={18} style={{ color: isOpen ? GOLD : '#555' }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden">
            <p className="pb-5 text-sm sm:text-base leading-relaxed" style={{ color: '#8a8a9a' }}>{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════ MONITOR FRAME ═══════════════════ */
function MonitorFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-2xl overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(212,165,70,0.08) 0%, rgba(15,15,20,0.9) 40%, rgba(15,15,20,0.95) 100%)',
        padding: '1px',
      }}>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0c0c10' }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff5f5730' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ffbd2e25' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#28c94025' }} />
          </div>
          <div className="flex-1 mx-6">
            <div className="h-5 rounded-lg max-w-xs" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
          </div>
        </div>
        <div className="relative overflow-hidden">
          <img src={src} alt={alt} loading="lazy" className="w-full block transition-transform duration-700 group-hover:scale-[1.015]" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ boxShadow: `inset 0 0 100px ${GOLD}06` }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════ BUTTONS ═══════════════════ */
function GoldButton({ children, onClick, size = 'lg' }: { children: React.ReactNode; onClick: () => void; size?: 'lg' | 'sm' }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.03, boxShadow: `0 15px 40px rgba(212,165,70,0.2)` }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden font-bold uppercase tracking-wider group
        ${size === 'lg' ? 'px-10 py-4 text-sm' : 'px-6 py-3 text-xs'}`}
      style={{ backgroundColor: GOLD, color: '#080808', border: `1px solid ${GOLD}` }}>
      <span className="absolute top-0 left-[-120%] w-[60%] h-full transition-all duration-700 ease-in-out group-hover:left-[150%] pointer-events-none"
        style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.7), transparent)', transform: 'skewX(-25deg)' }} />
      <span className="relative">{children}</span>
    </motion.button>
  );
}

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button onClick={onClick}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      className="px-8 py-4 text-sm font-bold uppercase tracking-wider border transition-all duration-300 hover:border-[#d4a546] hover:text-[#d4a546] hover:bg-[rgba(212,165,70,0.04)]"
      style={{ borderColor: 'rgba(255,255,255,0.15)', color: '#c8c8d0' }}>
      {children}
    </motion.button>
  );
}

/* ═══════════════════ MARQUEE ═══════════════════ */
function LocationsMarquee() {
  const all = [...LOCATIONS, ...LOCATIONS];
  return (
    <div className="w-full overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #07070a, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #07070a, transparent)' }} />
      <div className="marquee-track flex gap-4">
        {all.map((src, i) => (
          <div key={i} className="flex-shrink-0 w-[440px] sm:w-[520px] aspect-video rounded-xl overflow-hidden border transition-all duration-500 hover:border-[rgba(212,165,70,0.3)]"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <img src={src} alt="" loading="lazy" className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.8) saturate(0.85)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════ */
export default function PublicLandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 1.06]);

  useEffect(() => { if (isAuthenticated) navigate('/cases', { replace: true }); }, [isAuthenticated, navigate]);

  const tagline = 'Каждый подозреваемый лжёт. Каждая улика — ключ к истине.';
  const { displayed: typed, done: tagDone } = useTypewriter(tagline, 38, 1000);

  const goAuth = useCallback(() => navigate('/auth'), [navigate]);

  return (
    <div className="min-h-screen text-gray-200 overflow-x-hidden" style={{ background: '#07070a' }}>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ opacity: heroOpacity, scale: heroScale }}>
          {/* Detective photo — cinematic full bleed */}
          <div className="absolute inset-0">
            <img src={`${R2}/photo_2026-02-16_12-23-44.jpg`} alt=""
              className="absolute inset-0 w-full h-full object-cover object-[center_15%]"
              style={{ filter: 'contrast(1.15) saturate(0.65) brightness(0.5)' }} />

            {/* Cinematic color grade — warm amber tones matching the photo */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(12,10,6,0.88) 0%, rgba(12,10,6,0.55) 35%, rgba(8,7,5,0.25) 55%, rgba(7,7,10,0.65) 100%)' }} />

            {/* Left text area protection — strong enough to read text */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(7,7,10,0.95) 0%, rgba(7,7,10,0.8) 25%, rgba(7,7,10,0.3) 50%, transparent 65%)' }} />

            {/* Bottom seamless blend into page bg */}
            <div className="absolute bottom-0 left-0 right-0 h-[40%]"
              style={{ background: 'linear-gradient(to top, #07070a 0%, #07070a90 50%, transparent 100%)' }} />

            {/* Top soft vignette */}
            <div className="absolute top-0 left-0 right-0 h-40"
              style={{ background: 'linear-gradient(to bottom, rgba(7,7,10,0.4), transparent)' }} />
          </div>

          {/* Warm ambient glow behind detective */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,_rgba(140,100,35,0.07)_0%,_transparent_55%)]" />

          <FloatingParticles />

          {/* Film grain */}
          <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 w-full">
          <div className="max-w-xl lg:max-w-[560px]">
            {/* Beta */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }} className="mb-8">
              <span className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.35em] px-4 py-2 border"
                style={{ color: GOLD_DIM, borderColor: `${GOLD}15`, backgroundColor: `${GOLD}06`,
                  fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: GOLD }} />
                Бета · Дело №001 · Доступ разрешён
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mb-3">
              <span className="block text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] leading-[0.88] tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3',
                  textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>
                СТАНЬ
              </span>
              <span className="block text-[3.5rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6.5rem] leading-[0.88] tracking-tight mt-1"
                style={{ fontFamily: "'Playfair Display', serif",
                  background: `linear-gradient(135deg, ${GOLD_BRIGHT} 0%, ${GOLD} 50%, ${GOLD_DIM} 100%)`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ДЕТЕКТИВОМ
              </span>
            </motion.h1>

            {/* Decorative line */}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="h-[2px] w-20 sm:w-28 origin-left mb-7"
              style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />

            {/* Typewriter */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }} className="mb-6 min-h-[2rem]">
              <p className="text-base sm:text-lg italic"
                style={{ color: '#9a9a9a', fontWeight: 300, fontFamily: "'Playfair Display', serif" }}>
                {typed}
                {!tagDone && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-[2px] h-[18px] ml-1 align-text-bottom" style={{ backgroundColor: GOLD }} />
                )}
              </p>
            </motion.div>

            {/* Desc */}
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.6 }}
              className="text-[15px] sm:text-base mb-10 max-w-md leading-relaxed"
              style={{ color: '#6e6e7a', fontWeight: 300, fontFamily: "'Source Sans 3', sans-serif" }}>
              Допрашивай AI-подозреваемых, собирай улики на интерактивной доске и раскрой дело, которое поставило полицию в тупик.
            </motion.p>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row items-start gap-4">
              <GoldButton onClick={goAuth}>Начать расследование</GoldButton>
              <GhostButton onClick={() => document.getElementById('interrogation')?.scrollIntoView({ behavior: 'smooth' })}>
                Смотреть демо
              </GhostButton>
            </motion.div>
          </div>
        </div>

        {/* Scroll */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <span className="text-[9px] uppercase tracking-[0.25em]"
            style={{ color: '#444', fontFamily: "'JetBrains Mono', monospace" }}>Прокрутите</span>
          <div className="w-5 h-8 rounded-full border flex items-start justify-center p-1" style={{ borderColor: '#2a2a2a' }}>
            <motion.div className="w-1 h-1.5 rounded-full" style={{ backgroundColor: GOLD_DIM }}
              animate={{ y: [0, 12, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      </section>

      {/* ═══════ INTERROGATION ═══════ */}
      <section id="interrogation" className="relative py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SR>
            <div className="max-w-2xl mb-6">
              <span className="section-label" style={{ color: GOLD_DIM }}>Живой допрос</span>
              <h2 className="section-title">
                Подозреваемые, которые <span style={{ color: GOLD }}>лгут</span>
              </h2>
              <p className="section-desc">
                Забудьте о заранее прописанных ответах. Каждый персонаж — уникальная AI-личность с тайнами, алиби и мотивами.
                Они нервничают, пытаются сменить тему и могут быть пойманы на противоречиях.
              </p>
            </div>
          </SR>

          <SR delay={0.12} className="mb-5"><EmotionCycler /></SR>

          <SR delay={0.18} className="mb-10">
            <div className="flex flex-wrap gap-2">
              {['Система эмоций', 'Психологический портрет', 'Предъявление улик'].map(t => (
                <span key={t} className="tech-tag">{t}</span>
              ))}
            </div>
          </SR>

          <SR delay={0.25}>
            <MonitorFrame src={`${R2}/dopros.png`} alt="Интерфейс допроса" />
          </SR>
        </div>
      </section>

      {/* ═══════ MICRO CTA ═══════ */}
      <section className="py-8 px-6">
        <SR className="text-center">
          <motion.button onClick={goAuth}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="group px-6 py-3 text-xs font-bold uppercase tracking-widest border transition-all duration-400 hover:bg-[rgba(212,165,70,0.06)] hover:border-[#d4a546] hover:text-[#d4a546] hover:shadow-[0_0_30px_rgba(212,165,70,0.08)]"
            style={{ borderColor: `${GOLD}35`, color: GOLD_DIM }}>
            Попробовать бесплатно →
          </motion.button>
        </SR>
      </section>

      {/* ═══════ BOARD ═══════ */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SR>
            <div className="max-w-2xl mb-6">
              <span className="section-label" style={{ color: GOLD_DIM }}>Дедукция</span>
              <h2 className="section-title">
                Собирай картину <span style={{ color: GOLD }}>преступления</span>
              </h2>
              <p className="section-desc">
                Все найденные улики и показания попадают на интерактивную доску. Связывайте факты красными нитями,
                стройте теории и отделяйте ложь от истины.
              </p>
            </div>
          </SR>

          <SR delay={0.15} className="mb-10">
            <div className="flex flex-wrap gap-2">
              {['Drag & Drop', 'Валидация связей', 'Архив улик', 'Красные нити'].map(t => (
                <span key={t} className="tech-tag">{t}</span>
              ))}
            </div>
          </SR>

          <SR delay={0.25}>
            <MonitorFrame src={`${R2}/doska.png`} alt="Доска улик" />
          </SR>
        </div>
      </section>

      {/* ═══════ LOCATIONS ═══════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-10">
          <SR className="text-center">
            <span className="section-label" style={{ color: GOLD_DIM }}>Атмосфера</span>
            <h2 className="section-title text-center">
              Исследуй места <span style={{ color: GOLD }}>преступлений</span>
            </h2>
          </SR>
        </div>
        <SR><LocationsMarquee /></SR>
      </section>

      {/* ═══════ HOW IT WORKS — MODERN GRID ═══════ */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <SR className="text-center mb-14">
            <span className="section-label" style={{ color: GOLD_DIM }}>Процесс расследования</span>
            <h2 className="section-title text-center">
              Четыре шага до <span style={{ color: GOLD }}>истины</span>
            </h2>
          </SR>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              { num: '01', title: 'Осмотр', desc: 'Исследуйте фотореалистичные сцены. Кликайте на объекты, находите скрытые улики.', icon: Search, accent: '#c9a84c' },
              { num: '02', title: 'Допрос', desc: 'AI-подозреваемые лгут, нервничают, путаются. Предъявляйте улики — наблюдайте реакцию.', icon: MessageSquare, accent: '#e8a838' },
              { num: '03', title: 'Дедукция', desc: 'Связывайте улики на интерактивной доске. Система подтвердит верные связи.', icon: Network, accent: '#d49030' },
              { num: '04', title: 'Обвинение', desc: 'Назовите убийцу, мотив и метод. До 1050 баллов за идеальное раскрытие.', icon: Scale, accent: '#a07830' },
            ].map((step, i) => (
              <SR key={step.num} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, borderColor: step.accent + '35' }}
                  transition={{ duration: 0.35 }}
                  className="relative rounded-xl border p-6 sm:p-7 h-full group cursor-default"
                  style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(12,12,16,0.5)' }}>

                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${step.accent}08 0%, transparent 70%)` }} />

                  {/* Number */}
                  <span className="text-[11px] font-bold tracking-[0.3em] block mb-5"
                    style={{ color: step.accent + '50', fontFamily: "'JetBrains Mono', monospace" }}>
                    {step.num}
                  </span>

                  {/* Icon */}
                  <div className="mb-4 w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300"
                    style={{ backgroundColor: step.accent + '0c', border: `1px solid ${step.accent}12` }}>
                    <step.icon size={18} style={{ color: step.accent }} strokeWidth={1.5} />
                  </div>

                  <h3 className="text-lg font-bold mb-2.5"
                    style={{ fontFamily: "'Playfair Display', serif", color: '#e0deda' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#666670' }}>{step.desc}</p>

                  {/* Bottom line */}
                  <div className="absolute bottom-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(90deg, transparent, ${step.accent}25, transparent)` }} />
                </motion.div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SCORING ═══════ */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <SR className="text-center mb-12">
            <span className="section-label" style={{ color: GOLD_DIM }}>Система оценки</span>
            <h2 className="section-title text-center">
              До <span style={{ color: GOLD }}>1050</span> баллов
            </h2>
          </SR>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Верный подозреваемый', score: 500, max: 500, color: GOLD },
              { label: 'Точный мотив', score: 200, max: 200, color: '#c9a84c' },
              { label: 'Верный метод', score: 150, max: 150, color: '#a07830' },
              { label: 'Ключевые улики', score: 150, max: 150, color: '#8a7333' },
              { label: 'Бонус за мастерство', score: 50, max: 50, color: GOLD_BRIGHT },
            ].map((item, i) => (
              <SR key={item.label} delay={i * 0.08}
                className={i === 4 ? 'sm:col-span-2 sm:max-w-sm sm:mx-auto sm:w-full' : ''}>
                <div className="rounded-xl border p-5 transition-all duration-300 hover:border-[rgba(255,255,255,0.1)]"
                  style={{ backgroundColor: 'rgba(12,12,16,0.5)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: '#a0a0a8' }}>{item.label}</span>
                    <span className="text-lg font-bold"
                      style={{ color: item.color, fontFamily: "'Playfair Display', serif" }}>{item.score}</span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(item.score / item.max) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }} />
                  </div>
                </div>
              </SR>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF ═══════ */}
      <section className="py-12 px-6">
        <SR className="text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['#c9a84c', '#8b5cf6', '#3b82f6', '#10b981'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: c + '18', borderColor: '#07070a', color: c }}>
                  {['АК', 'МВ', 'ДС', 'ИП'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm" style={{ color: '#666' }}>
              Уже{' '}
              <span style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
                <AnimatedCounter target={847} duration={2500} />
              </span>{' '}
              детективов начали расследование
            </p>
          </div>
        </SR>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section className="relative py-24 sm:py-32 px-6">
        <div className="max-w-2xl mx-auto">
          <SR className="text-center mb-12">
            <span className="section-label" style={{ color: GOLD_DIM }}>Вопросы</span>
            <h2 className="section-title text-center">Частые вопросы</h2>
          </SR>
          <SR delay={0.12}>
            <div>
              {FAQ.map((item, i) => (
                <FaqItem key={i} item={item} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </SR>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="relative py-32 sm:py-40 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_35%_at_50%_50%,_rgba(212,165,70,0.04)_0%,_transparent_70%)]" />
        <SR>
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="section-label" style={{ color: GOLD_DIM }}>Первое дело — бесплатно</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 mt-4"
              style={{ fontFamily: "'Playfair Display', serif", color: '#e8e6e3' }}>
              Истина ждёт<span style={{ color: GOLD }}>.</span>
            </h2>
            <p className="text-lg mb-10 max-w-md mx-auto"
              style={{ color: '#555', fontWeight: 300, fontFamily: "'Source Sans 3', sans-serif" }}>
              Сколько тайн сможете раскрыть?
            </p>
            <GoldButton onClick={goAuth}>Начать расследование</GoldButton>
            <p className="mt-8 text-sm" style={{ color: '#3a3a3a' }}>
              Уже есть аккаунт?{' '}
              <button onClick={goAuth} className="underline underline-offset-2 transition-colors hover:text-gray-400">Войти</button>
            </p>
          </div>
        </SR>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm font-bold tracking-wider"
            style={{ fontFamily: "'Playfair Display', serif", color: GOLD_DIM }}>DETECTIVE AI</span>
          <span className="text-xs" style={{ color: '#3a3a3a' }}>
            Powered by AI ·{' '}
            <a href="https://t.me/wellcome_ai" target="_blank" rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-[#d4a546]" style={{ color: '#555' }}>
              t.me/wellcome_ai
            </a>
            {' '}· © 2025–2026
          </span>
        </div>
      </footer>

      {/* ═══════ STYLES ═══════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Source+Sans+3:wght@200;300;400;600;700&display=swap');

        @keyframes marquee-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-slide 60s linear infinite;
        }

        .section-label {
          display: inline-block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          margin-bottom: 1rem;
          font-family: 'JetBrains Mono', monospace;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(1.875rem, 4vw, 3rem);
          font-weight: 700;
          color: #e8e6e3;
          line-height: 1.15;
          margin-bottom: 1rem;
        }

        .section-desc {
          color: #7a7a84;
          font-size: 1rem;
          line-height: 1.7;
          font-weight: 300;
          max-width: 560px;
          font-family: 'Source Sans 3', sans-serif;
        }
        @media (min-width: 640px) {
          .section-desc { font-size: 1.1rem; }
        }

        .tech-tag {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255,255,255,0.08);
          color: #888;
          background: rgba(255,255,255,0.02);
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.3s ease;
        }
        .tech-tag:hover {
          border-color: rgba(212,165,70,0.3);
          color: #c9a84c;
          background: rgba(212,165,70,0.04);
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #07070a; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #2a2a2a; }

        ::selection { background: rgba(212,165,70,0.2); color: #f0d060; }
      `}</style>
    </div>
  );
}
