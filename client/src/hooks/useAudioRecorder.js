import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder(onChunkReady) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      const audioStream = new MediaStream([audioTrack]);

      const createAndStartRecorder = () => {
        const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' });
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 1000) {
            onChunkReady(e.data);
          }
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
      };

      // Initial start
      createAndStartRecorder();
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          createAndStartRecorder(); 
        }
      }, 15000);

      stream.getVideoTracks()[0].onended = () => stop();
    } catch (err) {
      console.error("Capture denied", err);
    }
  }, [onChunkReady]);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
  }, []);

  return { isRecording, start, stop };
}