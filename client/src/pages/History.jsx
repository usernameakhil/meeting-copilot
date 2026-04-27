import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      const { data, error } = await supabase
        .from('meetings')
        .select('meeting_id, transcript, created_at')
        .order('created_at', { ascending: false });

      if (error) console.error("Error fetching history:", error);
      else setMeetings(data);
      setLoading(false);
    }
    fetchMeetings();
  }, []);

  if (loading) return <div className="p-20 text-center text-slate-400 animate-pulse">Loading meeting history...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-slate-900">History</h1>
        <Link to="/" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">
          + New Meeting
        </Link>
      </div>

      <div className="grid gap-6">
        {meetings.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No meetings saved yet. Start a recording to see it here!</p>
          </div>
        ) : (
          meetings.map((m) => (
            <div key={m.meeting_id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 transition-all group">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">Session</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    {new Date(m.created_at).toLocaleDateString(undefined, { 
                      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-1 uppercase">{m.meeting_id}</p>
                </div>
                <Link 
                  to={`/chat/${m.meeting_id}`} 
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black group-hover:bg-indigo-600 transition shadow-lg shadow-slate-100"
                >
                  CHAT WITH AI
                </Link>
              </div>
              <p className="text-sm text-slate-500 mt-4 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                {m.transcript || "No transcript content available for this session."}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}