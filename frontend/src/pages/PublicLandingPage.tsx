import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Search, MessageSquare, PuzzleIcon, Scale, ChevronDown, Brain, MapPin, Target, Award } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const GOLD = '#d4a546';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function PublicLandingPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/cases', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const steps = [
    { icon: Search, title: 'Осмотр', desc: 'Исследуйте локации и находите улики в интерактивных сценах' },
    { icon: MessageSquare, title: 'Допросы', desc: 'AI-персонажи отвечают в реальном времени, скрывают тайны и врут' },
    { icon: PuzzleIcon, title: 'Доска улик', desc: 'Свяжите улики между собой и найдите скрытые закономерности' },
    { icon: Scale, title: 'Обвинение', desc: 'Назовите убийцу, мотив и метод — получите оценку до 1050 баллов' },
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI-допросы',
      desc: 'Каждый персонаж уникален: врёт, нервничает, скрывает тайны. Реакции зависят от предъявленных улик.',
    },
    {
      icon: MapPin,
      title: 'Живые локации',
      desc: 'Кликайте на объекты, ищите скрытые улики в фотореалистичных сценах.',
    },
    {
      icon: Target,
      title: 'Доска улик',
      desc: 'Связывайте доказательства, находите закономерности и восстанавливайте картину преступления.',
    },
    {
      icon: Award,
      title: 'Система оценки',
      desc: 'До 1050 баллов: правильный подозреваемый, мотив, метод и ключевые улики.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 overflow-x-hidden">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_#0a0a0f_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_30%,_rgba(0,0,0,0.6)_100%)]" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Search size={48} className="mx-auto mb-6 opacity-60" style={{ color: GOLD }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: GOLD }}
          >
            DETECTIVE AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Расследуй убийства. Допрашивай AI-подозреваемых.
            <br />
            Найди истину.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-3.5 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105"
              style={{ backgroundColor: GOLD, color: '#0a0a0f' }}
            >
              Начать расследование
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 z-10"
        >
          <ChevronDown size={28} className="text-gray-600" />
        </motion.div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: GOLD }}
            >
              Как это работает
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Четыре этапа расследования — от осмотра до обвинения
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <AnimatedSection key={step.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="bg-neutral-800/30 border border-neutral-700/30 rounded-xl p-6 text-center h-full hover:border-amber-700/30 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'rgba(212, 165, 70, 0.1)' }}
                  >
                    <step.icon size={22} style={{ color: GOLD }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-20 sm:py-28 px-4 bg-neutral-900/50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', serif", color: GOLD }}
            >
              Особенности
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat, i) => (
              <AnimatedSection key={feat.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="bg-neutral-800/20 border border-neutral-700/30 rounded-xl p-6 hover:border-amber-700/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <feat.icon size={20} className="mb-3" style={{ color: GOLD }} />
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 sm:py-28 px-4 text-center">
        <AnimatedSection>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: GOLD }}
          >
            Первое дело — бесплатно.
          </h2>
          <p className="text-gray-500 text-lg mb-8">Сколько правды сможете раскрыть?</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-3.5 text-lg font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105"
            style={{ backgroundColor: GOLD, color: '#0a0a0f' }}
          >
            Начать расследование
          </button>
          <p className="mt-4 text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <button onClick={() => navigate('/auth')} className="underline hover:text-gray-400 transition-colors">
              Войти
            </button>
          </p>
        </AnimatedSection>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-neutral-800 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <span style={{ fontFamily: "'Playfair Display', serif" }}>DETECTIVE AI</span>
          <span>Powered by OpenAI GPT-4o &middot; &copy; 2025-2026</span>
        </div>
      </footer>
    </div>
  );
}
