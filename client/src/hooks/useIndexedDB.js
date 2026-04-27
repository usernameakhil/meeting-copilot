import { useState, useEffect } from 'react';
import { meetingStore } from '../store/meetingStore';


export function useIndexedDB(meetingId) {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const existingChunks = await meetingStore.getMeetingChunks(meetingId);
        if (existingChunks.length > 0) {
          setSegments(existingChunks);
        }
      } catch (err) {
        console.error("Failed to load data from IndexedDB:", err);
      } finally {
        setLoading(false);
      }
    }

    if (meetingId) {
      loadInitialData();
    }
  }, [meetingId]);

  
  const saveNewSegment = async (text) => {
    const savedChunk = await meetingStore.addChunk(meetingId, text);
    if (savedChunk) {
      setSegments(prev => [...prev, savedChunk]);
    }
    return savedChunk;
  };

  return { segments, setSegments, saveNewSegment, loading };
}