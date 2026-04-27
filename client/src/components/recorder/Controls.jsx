import { Mic, Square, Loader2, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function Controls({ isRecording, onStart, onStop, isProcessing }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="flex items-center justify-center gap-8">
        <AnimatePresence mode="wait">
          {!isRecording ? (
            <motion.button
              key="start-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="flex items-center gap-3 bg-indigo-600 px-10 py-5 rounded-2xl text-white font-bold shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 active:shadow-inner"
            >
              <Mic size={24} className="animate-pulse" /> 
              Start Capturing
            </motion.button>
          ) : (
            <motion.button
              key="stop-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={onStop}
              className="flex items-center gap-3 bg-white border-2 border-rose-500 px-10 py-5 rounded-2xl text-rose-500 font-bold shadow-xl shadow-rose-50/50 hover:bg-rose-50 transition-colors"
            >
              <Square size={20} fill="currentColor" /> 
              Finish Meeting
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-6 h-6">
        {isRecording && (
          <div className="flex items-center gap-2 text-rose-500 font-mono font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            {formatTime(seconds)} • LIVE
          </div>
        )}

        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-indigo-500"
          >
            <Loader2 className="animate-spin" size={18} />
            <span className="text-xs font-bold uppercase tracking-tighter">AI Processing...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}