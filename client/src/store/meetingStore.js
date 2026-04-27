import { db } from '../lib/db';


export const meetingStore = {

  async initializeMeeting(meetingId) {
    try {
      await db.meetings.add({
        meetingId,
        status: 'active',
        createdAt: new Date()
      });
      console.log(`[MeetingStore] Initialized: ${meetingId}`);
    } catch (err) {
      console.error("[MeetingStore] Failed to initialize:", err);
    }
  },

  
  async addChunk(meetingId, text) {
    if (!text.trim()) return null;

    const newChunk = {
      meetingId,
      text: text.trim(),
      timestamp: Date.now()
    };

    try {
      const id = await db.chunks.add(newChunk);
      return { id, ...newChunk };
    } catch (err) {
      console.error("[MeetingStore] Error saving chunk:", err);
      return null;
    }
  },

  /**
   * Retrieves all chunks for a specific meeting (useful for UI recovery).
   */
  async getMeetingChunks(meetingId) {
    return await db.chunks
      .where({ meetingId })
      .sortBy('timestamp');
  },

  /**
   * Cleans up old meetings to prevent IndexedDB from growing too large.
   */
  async deleteMeeting(meetingId) {
    await db.meetings.where({ meetingId }).delete();
    await db.chunks.where({ meetingId }).delete();
    console.log(`[MeetingStore] Deleted session: ${meetingId}`);
  }
};