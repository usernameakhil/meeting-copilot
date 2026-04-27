import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function LiveTranscript({ segments }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [segments]);

  return (
    <div 
      ref={scrollRef}
      className="h-[500px] w-full bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/60 overflow-y-auto p-10 shadow-2xl shadow-slate-200/50 relative scroll-smooth"
    >
      <div className="max-w-prose mx-auto space-y-8">
        <AnimatePresence mode="popLayout">
          {segments.map((s, i) => (
            <motion.div
              key={s.timestamp || i}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative group"
            >
              <span className="absolute -left-16 top-1 text-[10px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">
                {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              <p className="text-slate-700 leading-relaxed text-xl font-medium selection:bg-indigo-100 selection:text-indigo-900">
                {s.text}
              </p>
              
              {i === segments.length - 1 && (
                <motion.div 
                  layoutId="indicator"
                  className="mt-4 h-1 w-12 bg-indigo-500/20 rounded-full"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {segments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full mt-24 opacity-40">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <span className="text-2xl">🎙️</span>
            </div>
            <p className="text-center text-slate-500 italic font-medium">
              Start capturing to see live insights...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}