import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'motion/react';
import { CalendarIcon, LocationMarkerIcon } from './components/Icons';

// Static particle data with drift properties
const STATIC_PARTICLES = [
  { id: 0, x: 12, y: 85, opacity: 0.3, duration: 12, delay: 1, drift: 20 },
  { id: 1, x: 45, y: 92, opacity: 0.4, duration: 15, delay: 3, drift: -15 },
  { id: 2, x: 78, y: 75, opacity: 0.2, duration: 18, delay: 0, drift: 25 },
  { id: 3, x: 23, y: 60, opacity: 0.5, duration: 11, delay: 5, drift: -10 },
  { id: 4, x: 56, y: 40, opacity: 0.3, duration: 14, delay: 2, drift: 15 },
  { id: 5, x: 89, y: 20, opacity: 0.4, duration: 16, delay: 4, drift: -20 },
  { id: 6, x: 5, y: 10, opacity: 0.2, duration: 13, delay: 6, drift: 10 },
  { id: 7, x: 34, y: 55, opacity: 0.5, duration: 17, delay: 1, drift: -25 },
  { id: 8, x: 67, y: 30, opacity: 0.3, duration: 12, delay: 3, drift: 20 },
  { id: 9, x: 95, y: 80, opacity: 0.4, duration: 15, delay: 0, drift: -15 },
  { id: 10, x: 15, y: 45, opacity: 0.2, duration: 14, delay: 2, drift: 30 },
  { id: 11, x: 40, y: 15, opacity: 0.5, duration: 11, delay: 4, drift: -10 },
  { id: 12, x: 70, y: 65, opacity: 0.3, duration: 16, delay: 5, drift: 15 },
  { id: 13, x: 2, y: 35, opacity: 0.4, duration: 13, delay: 1, drift: -20 },
  { id: 14, x: 50, y: 5, opacity: 0.2, duration: 18, delay: 3, drift: 25 },
  { id: 15, x: 85, y: 50, opacity: 0.5, duration: 12, delay: 0, drift: -15 },
  { id: 16, x: 28, y: 25, opacity: 0.3, duration: 15, delay: 2, drift: 10 },
  { id: 17, x: 62, y: 88, opacity: 0.4, duration: 14, delay: 4, drift: -30 },
  { id: 18, x: 92, y: 12, opacity: 0.2, duration: 17, delay: 6, drift: 20 },
  { id: 19, x: 38, y: 72, opacity: 0.5, duration: 13, delay: 1, drift: -15 },
];

const BackgroundParticles = () => {
  const { scrollY } = useScroll();
  const yRange = useTransform(scrollY, [0, 1000], [0, -200]);
  const springY = useSpring(yRange, { damping: 50, stiffness: 200 });

  return (
    <motion.div 
      style={{ y: springY }}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {STATIC_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          initial={{ x: p.x + "%", y: p.y + "%", opacity: p.opacity }}
          animate={{
            y: [null, "-20vh"],
            x: [p.x + "%", (p.x + p.drift) + "%"],
            opacity: [0, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay
          }}
        />
      ))}
    </motion.div>
  );
};

const TiltableBubble: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className, delay = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { damping: 20, stiffness: 150 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { damping: 20, stiffness: 150 });
  const scaleCard = useSpring(1, { damping: 20, stiffness: 150 });

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const scrollScale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } = containerRef.current!.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
    scaleCard.set(1.02);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scaleCard.set(1);
  };

  return (
    <motion.div 
      ref={containerRef} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        scale: scrollScale, 
        opacity: scrollOpacity,
        rotateX,
        rotateY,
        scaleZ: scaleCard,
        transformStyle: "preserve-3d"
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring",
        damping: 25,
        stiffness: 100,
        delay: delay,
      }}
      className={`perspective-container ${className} w-full`}
    >
      <div className="tilt-card h-full w-full relative overflow-hidden rounded-[2.5rem]">
        {/* Dynamic Glow Effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) => `radial-gradient(600px circle at ${((x as number) + 0.5) * 100}% ${((y as number) + 0.5) * 100}%, rgba(255,255,255,0.08), transparent 40%)`
            )
          }}
        />
        {children}
      </div>
    </motion.div>
  );
};

const StaggeredText: React.FC<{ text: string; className?: string; delay?: number }> = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  return (
    <div className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.5,
            delay: delay + (i * 0.1),
            ease: "easeOut"
          }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const bubbleBaseClasses = "bg-black/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl shadow-black/50 border border-white/10 w-full transition-colors duration-700 ease-out hover:border-white/30";

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <BackgroundParticles />
      
      <AnimatePresence mode="wait">
        {!isLoaded && (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.6 }}
              className="text-7xl font-black tracking-tighter text-white"
            >
              100
            </motion.div>
            <motion.div 
              className="w-12 h-[2px] bg-white/20 mt-4 overflow-hidden rounded-full"
            >
              <motion.div 
                className="h-full bg-white"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen w-full flex items-start justify-center p-6 antialiased relative">
        <div className="max-w-md w-full z-10 flex flex-col items-center gap-10 py-24">
          
          <TiltableBubble className="w-full" delay={1.5}>
            <div className={`${bubbleBaseClasses} p-10 text-center`}>
              <StaggeredText 
                text="Vous êtes invité" 
                className="text-sm font-black uppercase tracking-[0.5em] text-white/90 mb-4"
                delay={1.8}
              />
              <StaggeredText 
                text="à la fête d'anniversaire de" 
                className="text-xl font-medium text-slate-300"
                delay={2.0}
              />
            </div>
          </TiltableBubble>

          <TiltableBubble className="w-full" delay={1.7}>
            <div className={`${bubbleBaseClasses} py-12 px-4 text-center overflow-hidden relative group`}>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"
              />
              <h1 className="text-5xl sm:text-7xl font-black bg-gradient-to-b from-white via-slate-200 to-slate-400 text-transparent bg-clip-text leading-tight tracking-tight mb-6 px-2">
                Adrienne
              </h1>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.5, type: "spring" }}
                className="flex items-center justify-center gap-4"
              >
                <div className="h-px w-8 bg-white/10" />
                <p className="text-4xl font-bold text-white tracking-tight">
                  100 ans
                </p>
                <div className="h-px w-8 bg-white/10" />
              </motion.div>
            </div>
          </TiltableBubble>
          
          <TiltableBubble className="w-full" delay={1.9}>
             <div className={`${bubbleBaseClasses} p-8 flex items-center space-x-6`}>
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1, x: [0, -2, 2, 0], y: [0, -2, 2, 0] }}
                  transition={{ 
                    rotate: { duration: 0.4 },
                    x: { duration: 0.4 },
                    y: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 10 }
                  }}
                  className="flex-shrink-0 bg-white/5 text-white rounded-[1.25rem] p-5 border border-white/10 shadow-inner cursor-pointer"
                >
                  <CalendarIcon className="w-8 h-8" />
                </motion.div>
                <div className="text-left">
                  <h3 className="font-bold text-2xl text-white tracking-tight">Samedi 2 Mai</h3>
                  <p className="text-slate-400 font-medium text-lg">Rendez-vous à 12h00</p>
                </div>
              </div>
          </TiltableBubble>
          
          <TiltableBubble className="w-full" delay={2.1}>
            <div className="relative group">
              <a 
                href="https://www.google.com/maps?q=Restaurant+DA+ETTORE+Promenade+des+Champs-Frechets+13+Meyrin+Suisse" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ transform: "translateZ(10px)" }}
                className={`${bubbleBaseClasses} p-8 flex items-center space-x-6 hover:bg-white/[0.08] group cursor-pointer relative z-10 pointer-events-auto`}
              >
                <motion.div 
                  whileHover={{ scale: 1.15, x: [0, 2, -2, 0], y: [0, 2, -2, 0] }}
                  transition={{ 
                    x: { duration: 0.4 },
                    y: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 10 }
                  }}
                  className="flex-shrink-0 bg-white/5 text-white rounded-[1.25rem] p-5 border border-white/10 group-hover:border-white/20 transition-all duration-500"
                >
                  <LocationMarkerIcon className="w-8 h-8" />
                </motion.div>
                <div className="text-left">
                  <h3 className="font-bold text-2xl text-white tracking-tight">Restaurant DA ETTORE</h3>
                  <p className="text-slate-300 font-medium text-base mt-1">
                    Promenade des Champs-Fréchets 13, 1217 Meyrin, Suisse
                  </p>
                  <p className="text-slate-400 font-medium text-sm mt-2 group-hover:text-white transition-colors duration-300">
                    <span className="underline decoration-white/20 underline-offset-8">Voir sur la carte</span>
                  </p>
                </div>
              </a>
              
              {/* Fallback Copy Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText("Restaurant DA ETTORE, Promenade des Champs-Fréchets 13, 1217 Meyrin, Suisse");
                  const btn = e.currentTarget;
                  const originalText = btn.innerText;
                  btn.innerText = "Adresse copiée !";
                  btn.classList.add("text-green-400");
                  setTimeout(() => {
                    btn.innerText = originalText;
                    btn.classList.remove("text-green-400");
                  }, 2000);
                }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white/30 uppercase tracking-[0.2em] hover:text-white/60 transition-colors duration-300 z-20"
              >
                Copier l'adresse
              </button>
            </div>
          </TiltableBubble>
          
        </div>
      </main>
    </>
  );
};

export default App;
