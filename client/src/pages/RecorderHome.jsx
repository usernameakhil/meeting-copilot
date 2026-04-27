import React, { useState } from 'react';
import { db } from '../lib/db'; // Added to fetch final data for indexing

// Adjusted paths: moving up one level (..) to find hooks, services, etc.
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { syncService } from '../services/syncService';
import { sendAudioChunk } from '../api/transcribe';

import LiveTranscript from '../components/recorder/LiveTranscript';
import Controls from '../components/recorder/Controls';

export default function RecorderHome() {
  const [meetingId] = useState(`meet_${Date.now()}`);
  const [isProcessing, setIsProcessing] = useState(false);

  const { segments, saveNewSegment, loading } = useIndexedDB(meetingId);

  const onChunkReady = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const result = await sendAudioChunk(audioBlob);

      if (result && result.text && result.text.trim()) {
        await saveNewSegment(result.text);

        // Keep cloud backup in sync
        syncService.syncToCloud(meetingId).catch(err => 
          console.error("Background Sync Failed:", err)
        );
      }
    } catch (error) {
      console.error("Audio Pipeline Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const { isRecording, start, stop } = useAudioRecorder(onChunkReady);

  /**
   * Finalizes the meeting:
   * 1. Stops hardware capture
   * 2. Pushes final text to Supabase
   * 3. Triggers Python Backend to index text into ChromaDB for Chatbot
   */
  const handleStopMeeting = async () => {
  stop();
  
  // 1. Get current transcript chunks from IndexedDB
  const allLocalChunks = await db.chunks.where({ meetingId }).toArray();
  const finalTranscript = allLocalChunks.map(c => c.text).join(" ");

  // 2. Index into ChromaDB
  // IMPORTANT: Ensure meetingId here matches what's in your URL later!
  await fetch('http://127.0.0.1:8080/index-meeting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      meeting_id: meetingId, 
      transcript: finalTranscript 
    })
  });
  
  await syncService.finalizeMeeting(meetingId);
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-indigo-600 font-medium">Restoring Session...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-end mb-10 px-2">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              New<span className="text-indigo-600"> Recording</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Instant Groq-powered transcription</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-400">
              ID: {meetingId}
            </span>
          </div>
        </header>

        <main className="relative">
          <LiveTranscript segments={segments} />
          
          <Controls 
            isRecording={isRecording} 
            onStart={start} 
            onStop={handleStopMeeting} 
            isProcessing={isProcessing}
          />
        </main>

        <footer className="mt-8 flex justify-center items-center gap-6 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${segments.length > 0 ? 'bg-green-400' : 'bg-slate-300'}`} />
            Local IndexedDB: {segments.length} Chunks
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
            Cloud Status: {isRecording ? 'Syncing...' : 'Idle'}
          </div>
        </footer>

      </div>
    </div>
  );
}