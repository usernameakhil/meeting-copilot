import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RecorderHome from './pages/RecorderHome';
import History from './pages/History';
import Chat from './pages/Chat'; 

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <Link to="/" className="text-xl font-black text-slate-900">
              Meeting<span className="text-indigo-600">Copilot</span>
            </Link>
            <div className="flex gap-6 text-sm font-bold text-slate-500">
              <Link to="/" className="hover:text-indigo-600 transition">Record</Link>
              <Link to="/history" className="hover:text-indigo-600 transition">History</Link>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<RecorderHome />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat/:meetingId" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;