import Dexie from 'dexie';

export const db = new Dexie('MeetingCopilotDB');

db.version(1).stores({
  meetings: '++id, meetingId, status, createdAt',
  chunks: '++id, meetingId, text, timestamp' 
});