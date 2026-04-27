import { db } from '../lib/db';
import { supabase } from '../lib/supabase';

export const syncService = {
  
  async syncToCloud(meetingId, threshold = 100) {
    try {
      const allChunks = await db.chunks.where({ meetingId }).toArray();
      const fullTranscript = allChunks.map(c => c.text).join(" ");

      if (fullTranscript.length > threshold) {
        console.log(`[SyncService] Threshold hit (${fullTranscript.length} chars). Syncing...`);
        
        const { error } = await supabase
          .from('meetings')
          .upsert({ 
            meeting_id: meetingId, 
            transcript: fullTranscript,
            created_at: new Date() 
          }, { onConflict: 'meeting_id' });

        if (error) throw error;
        return { success: true, synced: true };
      }
      
      return { success: true, synced: false };
    } catch (err) {
      console.error("[SyncService] Sync failed:", err.message);
      return { success: false, error: err.message };
    }
  },

  async finalizeMeeting(meetingId) {
    try {
      const allChunks = await db.chunks.where({ meetingId }).toArray();
      const finalTranscript = allChunks.map(c => c.text).join(" ");

      const { error } = await supabase
        .from('meetings')
        .upsert({ 
          meeting_id: meetingId, 
          transcript: finalTranscript, 
          created_at: new Date() 
        }, { onConflict: 'meeting_id' });

      if (error) throw error;
      console.log(" Final cloud sync complete.");
      return true;
    } catch (err) {
      console.error("[SyncService] Finalize failed:", err.message);
      return false;
    }
  }
};