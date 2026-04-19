import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue, MotionValue } from 'motion/react';
import { Calendar, MapPin, UtensilsCrossed, Info, Maximize, Play, CheckCircle2, X, ChevronRight, Check } from 'lucide-react';
import { db } from './src/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

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

const Particle: React.FC<{ p: typeof STATIC_PARTICLES[0]; mouseX: MotionValue<number>; mouseY: MotionValue<number> }> = ({ p, mouseX, mouseY }) => {
  const parallaxX = useTransform(mouseX, [-0.5, 0.5], [p.drift * -0.5, p.drift * 0.5]);
  const parallaxY = useTransform(mouseY, [-0.5, 0.5], [p.drift * -0.5, p.drift * 0.5]);
  const springX = useSpring(parallaxX, { damping: 60, stiffness: 120 });
  const springY = useSpring(parallaxY, { damping: 60, stiffness: 120 });

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: p.id % 4 === 0 ? '6px' : '3px',
        height: p.id % 4 === 0 ? '6px' : '3px',
        backgroundColor: p.id % 3 === 0 ? 'rgba(255, 182, 193, 0.4)' : 'rgba(255, 255, 255, 0.2)',
        left: p.x + "%",
        top: p.y + "%",
        x: springX,
        y: springY,
        opacity: p.opacity,
        filter: p.id % 5 === 0 ? "blur(2px)" : "none"
      }}
      animate={{
        y: [null, "-40vh"],
        opacity: [0, p.opacity, 0],
      }}
      transition={{
        duration: p.duration,
        repeat: Infinity,
        ease: "linear",
        delay: p.delay
      }}
    />
  );
};

const BackgroundParticles = () => {
  const { scrollY } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const scrollYTransform = useTransform(scrollY, [0, 1000], [0, -150]);
  const springScrollY = useSpring(scrollYTransform, { damping: 50, stiffness: 200 });

  return (
    <motion.div 
      style={{ y: springScrollY }}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    >
      {STATIC_PARTICLES.map((p) => (
        <Particle key={p.id} p={p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </motion.div>
  );
};

const TiltableBubble: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
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
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
    scaleCard.set(1.02);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    scaleCard.set(1);
  };

  const variants = {
    hidden: { opacity: 0, y: 100, scale: 0.9, rotateX: -45, rotateY: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      rotateX: 0,
      rotateY: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 70,
        duration: 1.5
      }
    }
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
        transformStyle: "preserve-3d",
        perspective: "1200px"
      }}
      variants={variants}
      className={`perspective-container ${className} w-full relative z-10`}
    >
      <div 
        className="tilt-card h-full w-full relative rounded-[2.5rem] transform-gpu shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-white/10" 
        style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
      >
        {/* Dynamic Glow Effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"
          style={{
            background: useTransform(
              [mouseX, mouseY],
              ([x, y]) => `radial-gradient(600px circle at ${((x as number) + 0.5) * 100}% ${((y as number) + 0.5) * 100}%, rgba(255,255,255,0.05), transparent 40%)`
            ),
            transform: "translateZ(80px)"
          }}
        />
        <div style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
          {children}
        </div>
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

const Background = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#050505]">
    <motion.div 
      className="absolute inset-0 opacity-40 scale-110"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2076&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        perspective: "1000px"
      }}
      animate={{
        rotateX: [0, 2, 0, -2, 0],
        rotateY: [0, -2, 0, 2, 0],
        scale: [1.1, 1.15, 1.1],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/80 via-transparent to-[#050505]/90" />
  </div>
);

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center p-6 text-center">
          <div className="max-w-xs">
            <h2 className="text-rose-100 text-xl font-serif mb-4">Oups ! Quelque chose s'est mal passé.</h2>
            <p className="text-rose-200/60 text-sm mb-6">L'application a rencontré une erreur. Veuillez rafraîchir la page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 border border-rose-200/30 text-rose-100 rounded-full text-xs uppercase tracking-widest"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const RSVPModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [starterChoice, setStarterChoice] = useState<'jambon' | 'tomate' | 'crevette' | 'none'>('none');
  const [mealChoice, setMealChoice] = useState<'perche' | 'boeuf' | 'none'>('none');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingResponseId, setExistingResponseId] = useState<string | null>(null);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  const checkExistingResponse = async (name: string) => {
    setIsSubmitting(true);
    try {
      const q = query(collection(db, 'rsvps'), where('guestName', '==', name));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        const data = docData.data();
        setExistingResponseId(docData.id);
        setStarterChoice(data.starterChoice || 'none');
        setMealChoice(data.mealChoice || 'none');
        setComment(data.comment || '');
        setShowUpdatePrompt(true);
      } else {
        setStep(2);
      }
    } catch (error) {
      console.error("Error checking response:", error);
      setStep(2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!guestName || starterChoice === 'none' || mealChoice === 'none') return;
    setIsSubmitting(true);
    try {
      const rsvpData = {
        guestName,
        status: 'present',
        starterChoice,
        mealChoice,
        comment,
        createdAt: serverTimestamp()
      };

      if (existingResponseId) {
        await setDoc(doc(db, 'rsvps', existingResponseId), rsvpData);
      } else {
        await addDoc(collection(db, 'rsvps'), rsvpData);
      }
      
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setStep(1);
          setGuestName('');
          setStarterChoice('none');
          setMealChoice('none');
          setComment('');
          setIsSuccess(false);
          setExistingResponseId(null);
          setShowUpdatePrompt(false);
        }, 500);
      }, 2000);
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      alert("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guest list from the provided document
  const commonGuests = [
    "Mica", "Katrin", "Roland", "Monique", "Felix", "Eveline",
    "Sébastien", "Elora", "Mayrine", "Sarah", "Nelson", "Liam",
    "Axelle", "Sacha", "Ethan", "Adrien", "Manu", "Rachelle",
    "Isabelle", "Gérard", "Antoinette", "Azim", "Adrienne", "Sandra",
    "Victor"
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, rotateX: 10 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        className="bg-white/5 border border-white/10 rounded-[3rem] w-full max-w-lg p-8 sm:p-12 relative shadow-2xl overflow-hidden"
      >
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-8 right-8 text-rose-200/40 hover:text-rose-200 transition-colors">
          <X className="w-6 h-6" />
        </button>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-rose-50 mb-2">Merci !</h3>
              <p className="text-rose-200/60 italic text-lg">Votre réponse a bien été enregistrée.</p>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0, x: -20 }}>
              {/* Step 1: Who are you? */}
              {step === 1 && !showUpdatePrompt && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-3xl font-serif font-bold text-rose-50 mb-8 tracking-tight">Qui êtes-vous ?</h3>
                  <div className="space-y-4 mb-8">
                    <select
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-rose-50 focus:outline-none focus:border-rose-500/50 transition-all text-lg appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#1a0f0a]">Sélectionnez votre nom...</option>
                      {commonGuests.sort().map((name) => (
                        <option key={name} value={name} className="bg-[#1a0f0a]">{name}</option>
                      ))}
                    </select>
                    <p className="text-rose-200/30 text-xs px-2 italic">Veuillez choisir votre nom dans la liste officielle.</p>
                  </div>
                  <button
                    disabled={!guestName || isSubmitting}
                    onClick={() => checkExistingResponse(guestName)}
                    className="w-full py-5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-50 font-serif text-xl rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl group"
                  >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Suivant
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Update Prompt */}
              {step === 1 && showUpdatePrompt && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <Info className="w-8 h-8 text-rose-300" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-rose-50 mb-4 text-center">Vous avez déjà répondu</h3>
                  <p className="text-rose-200/60 text-center italic mb-8">Voulez-vous modifier votre réponse existante ?</p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => { setShowUpdatePrompt(false); setStep(2); }}
                      className="w-full py-5 bg-rose-500 text-white font-serif text-xl rounded-2xl transition-all shadow-xl shadow-rose-500/20"
                    >
                      Modifier ma réponse
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                           setGuestName('');
                           setExistingResponseId(null);
                           setShowUpdatePrompt(false);
                        }, 500);
                      }}
                      className="w-full py-4 text-rose-200/40 text-sm font-bold uppercase tracking-widest hover:text-rose-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Starter Choice */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-3xl font-serif font-bold text-rose-50 mb-2 tracking-tight">Quelle entrée souhaitez-vous ?</h3>
                  <p className="text-rose-200/40 italic mb-8">Sélectionnez votre entrée à choix.</p>
                  <div className="space-y-4 mb-8">
                    <button
                      onClick={() => setStarterChoice('jambon')}
                      className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${starterChoice === 'jambon' ? 'bg-rose-500/20 border-rose-500/50 text-rose-50' : 'bg-white/5 border-white/10 text-rose-200/60'}`}
                    >
                      <span className="text-left font-medium text-lg">Jambon de Parme</span>
                      {starterChoice === 'jambon' && <Check className="w-6 h-6 text-rose-300" />}
                    </button>
                    <button
                      onClick={() => setStarterChoice('tomate')}
                      className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${starterChoice === 'tomate' ? 'bg-rose-500/20 border-rose-500/50 text-rose-50' : 'bg-white/5 border-white/10 text-rose-200/60'}`}
                    >
                      <span className="text-left font-medium text-lg">Tomate Mozzarella</span>
                      {starterChoice === 'tomate' && <Check className="w-6 h-6 text-rose-300" />}
                    </button>
                    <button
                      onClick={() => setStarterChoice('crevette')}
                      className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${starterChoice === 'crevette' ? 'bg-rose-500/20 border-rose-500/50 text-rose-50' : 'bg-white/5 border-white/10 text-rose-200/60'}`}
                    >
                      <span className="text-left font-medium text-lg">Cocktail de crevettes</span>
                      {starterChoice === 'crevette' && <Check className="w-6 h-6 text-rose-300" />}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 text-rose-200/40 text-sm font-bold uppercase tracking-widest hover:text-rose-200 transition-colors">Retour</button>
                    <button
                      disabled={starterChoice === 'none'}
                      onClick={() => setStep(3)}
                      className="flex-[2] py-5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-50 font-serif text-xl rounded-2xl transition-all"
                    >
                      Suivant
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Meal choice */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-3xl font-serif font-bold text-rose-50 mb-2 tracking-tight">Quel plat préférez-vous ?</h3>
                  <p className="text-rose-200/40 italic mb-8">Pour la gestion du traiteur.</p>
                  <div className="space-y-4 mb-8">
                    <button
                      onClick={() => setMealChoice('perche')}
                      className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${mealChoice === 'perche' ? 'bg-rose-500/20 border-rose-500/50 text-rose-50' : 'bg-white/5 border-white/10 text-rose-200/60'}`}
                    >
                      <span className="text-left">
                        <span className="block font-medium text-lg">Filets de perche</span>
                        <span className="text-xs opacity-40">Frites</span>
                      </span>
                      {mealChoice === 'perche' && <Check className="w-6 h-6 text-rose-300" />}
                    </button>
                    <button
                      onClick={() => setMealChoice('boeuf')}
                      className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${mealChoice === 'boeuf' ? 'bg-rose-500/20 border-rose-500/50 text-rose-50' : 'bg-white/5 border-white/10 text-rose-200/60'}`}
                    >
                      <span className="text-left">
                        <span className="block font-medium text-lg">Médaillons de bœuf</span>
                        <span className="text-xs opacity-40">Sauce morilles, frites, légumes</span>
                      </span>
                      {mealChoice === 'boeuf' && <Check className="w-6 h-6 text-rose-300" />}
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 text-rose-200/40 text-sm font-bold uppercase tracking-widest hover:text-rose-200 transition-colors">Retour</button>
                    <button
                      disabled={mealChoice === 'none'}
                      onClick={() => setStep(4)}
                      className="flex-[2] py-5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-50 font-serif text-xl rounded-2xl transition-all"
                    >
                      Suivant
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Comment and Submit */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-3xl font-serif font-bold text-rose-50 mb-8 tracking-tight">Autre chose à ajouter ?</h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Votre message..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-rose-50 placeholder:text-rose-200/20 focus:outline-none focus:border-rose-500/50 transition-all text-lg mb-4 resize-none"
                  />
                  
                  <button 
                    disabled={isSubmitting}
                    onClick={() => { setComment(''); handleSubmit(); }}
                    className="w-full mb-8 text-rose-200/40 hover:text-rose-200 text-sm italic transition-colors block text-center underline underline-offset-4 decoration-rose-500/30"
                  >
                    Je n'ai rien de particulier à ajouter
                  </button>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="flex-1 py-4 text-rose-200/40 text-sm font-bold uppercase tracking-widest hover:text-rose-200 transition-colors">Retour</button>
                    <button
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="flex-[2] py-5 bg-rose-500 text-white hover:bg-rose-600 font-serif text-xl rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Envoyer ma réponse"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

const AppContent: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [isOpeningMap, setIsOpeningMap] = useState(false);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const mapTimeoutRef1 = useRef<NodeJS.Timeout | null>(null);
  const mapTimeoutRef2 = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (mapTimeoutRef1.current) clearTimeout(mapTimeoutRef1.current);
      if (mapTimeoutRef2.current) clearTimeout(mapTimeoutRef2.current);
    };
  }, []);

  const handleOpenMap = () => {
    if (isOpeningMap) return;
    setIsOpeningMap(true);
    
    // Animation duration before opening
    mapTimeoutRef1.current = setTimeout(() => {
      window.open("https://maps.google.com/?q=Restaurant+DA+ETTORE+Meyrin+Suisse", "_blank", "noopener,noreferrer");
      // Keep overlay for a bit after opening to feel smooth
      mapTimeoutRef2.current = setTimeout(() => setIsOpeningMap(false), 500);
    }, 2000);
  };

  const toggleFullscreen = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = window.document as any;
      const docEl = doc.documentElement;

      const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
      const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

      if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (requestFullScreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          requestFullScreen.call(docEl).catch((err: any) => console.warn("Fullscreen error:", err));
        }
      } else {
        if (cancelFullScreen) {
          cancelFullScreen.call(doc);
        }
      }
    } catch (e) {
      console.warn("Fullscreen API error", e);
    }
  };

  const handleStart = () => {
    try {
      toggleFullscreen();
    } catch (e) {
      console.warn("Fullscreen not supported or failed", e);
    }
    setIsLoaded(true);
  };

  const bubbleBaseClasses = "w-full transition-all duration-700 ease-out";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowStart(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Background />
      <BackgroundParticles />

      <AnimatePresence>
        {isOpeningMap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center overflow-hidden h-[100dvh]"
            style={{ WebkitBackdropFilter: 'blur(24px)' }}
          >
            <div className="relative flex items-center justify-center">
              {/* Expanding Rings (Circles made of a line) */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ 
                    scale: [0.2, 4], 
                    opacity: [0, 0.6, 0] 
                  }}
                  transition={{ 
                    duration: 2.5, 
                    repeat: Infinity, 
                    delay: i * 0.5,
                    ease: "easeOut" 
                  }}
                  className="absolute w-40 h-40 border border-rose-200/30 rounded-full"
                />
              ))}

              {/* Central Circle with Google Maps Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative z-10 w-28 h-28 bg-white/10 backdrop-blur-md border border-rose-100/20 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                style={{ WebkitBackdropFilter: 'blur(12px)' }}
              >
                {/* New Google Maps Pin Icon in Rose-200 */}
                <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 13C9.79086 13 8 11.2091 8 9C8 6.79086 9.79086 5 12 5C14.2091 5 16 6.79086 16 9C16 11.2091 14.2091 13 12 13Z" 
                    fill="#fecdd3"
                  />
                </svg>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute top-40 flex flex-col items-center gap-2"
              >
                <p className="whitespace-nowrap font-serif italic text-rose-100 text-2xl tracking-widest">
                  Ouverture de la carte...
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-rose-200 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isLoaded && (
          <motion.div 
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] h-[100dvh]"
          >
            <div className="flex flex-col items-center" style={{ perspective: "1000px" }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0, filter: "blur(10px)", rotateY: -90 }}
                animate={{ scale: 1, opacity: 1, filter: "blur(0px)", rotateY: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-8xl font-serif font-bold tracking-tighter text-rose-100"
                style={{ transformStyle: "preserve-3d" }}
              >
                100
              </motion.div>
              <motion.div 
                className="w-16 h-[2px] bg-rose-200/20 mt-6 overflow-hidden rounded-full"
              >
                <motion.div 
                  className="h-full bg-rose-200"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            <AnimatePresence>
              {showStart && (
                <motion.div
                  initial={{ opacity: 0, y: 20, rotateX: 45 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                  className="absolute bottom-24"
                >
                  <motion.button
                    onClick={handleStart}
                    whileHover={{ scale: 1.05, translateZ: 20 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-8 py-3 bg-transparent border border-rose-200/30 text-rose-100 hover:bg-rose-200/10 font-medium uppercase tracking-[0.3em] text-xs rounded-full transition-all shadow-[0_0_20px_rgba(255,182,193,0.1)]"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Ouvrir l'invitation
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-[100dvh] w-full flex items-start justify-center p-6 antialiased relative z-10">
        {/* Fullscreen Toggle */}
        <motion.button 
          onClick={toggleFullscreen}
          whileTap={{ scale: 0.9, opacity: 0.8 }}
          whileHover={{ scale: 1.1 }}
          aria-label="Basculer en plein écran"
          className="fixed top-6 right-6 z-30 p-3 bg-black/20 backdrop-blur-md hover:bg-black/40 border border-rose-200/10 rounded-full text-rose-200/60 hover:text-rose-200 transition-all duration-300"
          style={{ WebkitBackdropFilter: 'blur(12px)' }}
          title="Plein écran"
        >
          <Maximize className="h-5 w-5" />
        </motion.button>

        <AnimatePresence>
          {isLoaded && (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.15
                  }
                }
              }}
              className="max-w-md w-full z-10 flex flex-col items-center gap-10 py-24"
            >
          
          <TiltableBubble className="w-full">
            <div className={`${bubbleBaseClasses} p-10 text-center`}>
              <StaggeredText 
                text="Vous êtes invité" 
                className="text-xs font-medium uppercase tracking-[0.4em] text-rose-200/80 mb-4"
                delay={0.2}
              />
              <StaggeredText 
                text="à la fête d'anniversaire de" 
                className="text-lg font-serif italic text-rose-100/70"
                delay={0.4}
              />
            </div>
          </TiltableBubble>

          <TiltableBubble className="w-full">
            <div className={`${bubbleBaseClasses} py-12 px-4 text-center overflow-hidden relative group rounded-[2.5rem]`}>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-200/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"
              />
              <h1 
                className="font-serif text-6xl sm:text-8xl font-bold bg-gradient-to-b from-rose-50 via-rose-200 to-rose-400 text-transparent bg-clip-text leading-tight tracking-tight mb-6 px-2"
                style={{ transform: "translateZ(60px)" }}
              >
                Adrienne
              </h1>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, translateZ: -20 }}
                animate={{ opacity: 1, scale: 1, translateZ: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="flex items-center justify-center gap-6"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="h-px w-12 bg-rose-200/20" />
                <p className="font-serif italic text-4xl text-rose-200 tracking-tight" style={{ transform: "translateZ(40px)" }}>
                  100 ans
                </p>
                <div className="h-px w-12 bg-rose-200/20" />
              </motion.div>
            </div>
          </TiltableBubble>
          
          <TiltableBubble className="w-full">
             <div className={`${bubbleBaseClasses} p-8 flex items-center space-x-6 rounded-[2.5rem]`}>
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1, x: [0, -2, 2, 0], y: [0, -2, 2, 0] }}
                  transition={{ 
                    rotate: { duration: 0.4 },
                    x: { duration: 0.4 },
                    y: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 10 }
                  }}
                  className="flex-shrink-0 bg-rose-500/10 text-rose-200 rounded-[1.25rem] p-5 shadow-[0_0_20px_rgba(244,63,94,0.05)] cursor-pointer border border-rose-500/20"
                >
                  <Calendar className="w-8 h-8" />
                </motion.div>
                <div className="text-left">
                  <h3 className="font-serif font-bold text-3xl text-rose-50 tracking-tight">Samedi 2 Mai</h3>
                  <p className="text-rose-200/70 font-medium text-lg mt-1">Rendez-vous à 12h00</p>
                </div>
              </div>
          </TiltableBubble>
          
          <TiltableBubble className="w-full">
            <div className="relative group rounded-[2.5rem]">
              <motion.div 
                onClick={handleOpenMap}
                role="button"
                tabIndex={0}
                aria-label="Ouvrir l'itinéraire sur Google Maps"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenMap();
                  }
                }}
                style={{ transform: "translateZ(60px)", transformStyle: "preserve-3d" }}
                className={`${bubbleBaseClasses} p-8 flex items-center space-x-6 group cursor-pointer relative z-30 pointer-events-auto block no-underline rounded-[2.5rem] overflow-hidden`}
              >
                <motion.div 
                  whileHover={{ scale: 1.15, x: [0, 2, -2, 0], y: [0, 2, -2, 0] }}
                  transition={{ 
                    x: { duration: 0.4 },
                    y: { duration: 0.4 },
                    scale: { type: "spring", stiffness: 300, damping: 10 }
                  }}
                  className="flex-shrink-0 bg-rose-500/10 text-rose-200 rounded-[1.25rem] p-5 group-hover:bg-rose-500/20 transition-all duration-500 pointer-events-none border border-rose-500/20 relative z-10 shadow-[0_0_20px_rgba(244,63,94,0.05)]"
                >
                  <MapPin className="w-8 h-8" />
                </motion.div>
                
                <div className="text-left pointer-events-none relative z-10">
                  <h3 className="font-serif font-bold text-3xl text-rose-50 tracking-tight">
                    Restaurant DA ETTORE
                  </h3>
                  <p className="text-rose-200/80 font-medium text-base mt-1">
                    Promenade des Champs-Fréchets 13, 1217 Meyrin, Suisse
                  </p>
                  <p className="text-rose-300/60 font-medium text-sm mt-3 group-hover:text-rose-200 transition-colors duration-300">
                    <span className="underline decoration-rose-200/30 underline-offset-8">
                      Voir sur la carte
                    </span>
                  </p>
                </div>
              </motion.div>
            </div>
          </TiltableBubble>

          {/* Menu Section */}
          <TiltableBubble className="w-full">
            <div className={`${bubbleBaseClasses} p-8 flex flex-col space-y-6 rounded-[2.5rem]`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex-shrink-0 bg-rose-500/10 text-rose-200 rounded-[1.25rem] p-5 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-3xl text-rose-50 tracking-tight">Le Menu</h3>
                </div>
                <div className="hidden sm:block h-px flex-grow mx-8 bg-gradient-to-r from-rose-200/20 to-transparent" />
              </div>
              
              <div className="grid gap-6 pl-2">
                <div>
                  <h4 className="text-rose-200 font-bold uppercase tracking-wider text-xs mb-3">Entrée à choix</h4>
                  <ul className="text-rose-100/70 space-y-1 text-lg">
                    <li>• Jambon de Parme</li>
                    <li>• Tomate Mozzarella</li>
                    <li>• Cocktail de crevettes</li>
                  </ul>
                </div>
                
                <div className="h-px w-full bg-rose-200/10" />
                
                <div>
                  <h4 className="text-rose-200 font-bold uppercase tracking-wider text-xs mb-3">Plat à choix</h4>
                  <ul className="text-rose-100/70 space-y-3 text-lg">
                    <li>
                      <span className="block font-medium">Filets de perche</span>
                      <span className="text-sm opacity-60 block">Frites</span>
                    </li>
                    <li>
                      <span className="block font-medium">Médaillons de bœuf</span>
                      <span className="text-sm opacity-60 block">Sauce morilles, frites, légumes</span>
                    </li>
                  </ul>
                </div>
                
                <div className="h-px w-full bg-rose-200/10" />
                
                <div>
                  <h4 className="text-rose-200 font-bold uppercase tracking-wider text-xs mb-3">Dessert offert</h4>
                  <p className="text-rose-100 italic text-xl">Surprise</p>
                </div>
              </div>
            </div>
          </TiltableBubble>

          {/* RSVP Button Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="w-full pt-8 pb-24 text-center"
          >
            <motion.button
              onClick={() => setShowRSVPModal(true)}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(244,63,94,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="px-12 py-5 bg-rose-500/20 border border-rose-500/40 text-rose-50 font-serif text-xl rounded-[2rem] transition-all flex items-center justify-center gap-4 mx-auto shadow-xl"
            >
              <CheckCircle2 className="w-6 h-6 text-rose-200" />
              Répondre à l'invitation
            </motion.button>
          </motion.div>
          
          <RSVPModal isOpen={showRSVPModal} onClose={() => setShowRSVPModal(false)} />
          
        </motion.div>
      )}
    </AnimatePresence>
  </main>
    </>
  );
};

export default App;
