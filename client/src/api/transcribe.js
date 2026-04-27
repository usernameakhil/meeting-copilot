import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const sendAudioChunk = async (blob) => {
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');

  const response = await axios.post(`${API_URL}/transcribe`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data; // Expected { text: "..." }
};