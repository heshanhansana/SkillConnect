import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ActiveMembers() {
  const [activeMembers, setActiveMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveMembers();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveMembers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/active?limit=5&minutes=30');
      const data = await response.json();
      if (data.success) {
        setActiveMembers(data.users);
      }
    } catch (error) {
      console.error('Error fetching active members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return "Just now";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleMessage = (userId, e) => {
    e.stopPropagation();
    navigate(`/chat?userId=${userId}`);
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-3xl shadow-lg border border-purple-200 p-6 text-gray-900">
        <h2 className="font-semibold text-lg mb-4 text-gray-900">Active Members Now</h2>
        <p className="text-gray-500 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-lg border border-purple-200 p-6 text-gray-900 hover:shadow-purple-300/40 transition">
      <h2 className="font-semibold text-lg mb-4 text-gray-900">Active Members Now</h2>

      {activeMembers.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No active members</p>
      ) : (
        <div className="space-y-3">
          {activeMembers.map((m) => (
            <div
              key={m._id}
              className="flex items-center justify-between p-4 rounded-2xl border border-purple-100 hover:border-purple-300 transition cursor-pointer"
              onClick={() => handleProfileClick(m._id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6C38FF] via-[#4C2AFF] to-[#EC38F5] text-white flex items-center justify-center text-[10px] font-bold shadow">
                  {m.firstName?.[0]}{m.lastName?.[0]}
                </div>

                <div>
                  <p className="font-medium text-gray-900">
                    {m.firstName} {m.lastName}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 gap-2">
                    <span className={`w-2 h-2 rounded-full ${m.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {getTimeAgo(m.lastActive)}
                  </div>
                </div>
              </div>

              <button 
                onClick={(e) => handleMessage(m._id, e)}
                className="px-3 py-1.5 text-sm rounded-xl bg-gradient-to-r from-[#7D4DF4] to-[#A589FD] text-white shadow hover:opacity-90 transition"
              >
                Message
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
