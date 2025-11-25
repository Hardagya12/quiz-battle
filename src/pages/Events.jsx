import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";
import { HiCalendar, HiTicket } from "react-icons/hi2";

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await api.get("/events/upcoming");
        setEvents(response.data.events || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register`);
      const response = await api.get("/events/upcoming");
      setEvents(response.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="relative z-10 text-neo-black font-pixel text-2xl animate-pulse">LOADING EVENTS...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <RetroBackground />
        <Sidebar />
        <div className="bg-neo-white p-8 border-3 border-neo-black shadow-neo-xl text-center relative z-10">
          <p className="text-neo-primary font-bold font-mono mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            GO HOME
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-8 flex-wrap gap-4 bg-neo-white p-6 border-3 border-neo-black shadow-neo">
          <div>
            <h1 className="text-3xl font-bold font-pixel text-neo-black flex items-center gap-3">
              <HiCalendar className="text-neo-secondary" />
              LIVE EVENTS
            </h1>
            <p className="text-gray-600 font-mono mt-2 font-bold uppercase text-sm">Join tournaments for exclusive rewards</p>
          </div>
          <button onClick={() => navigate("/")} className="btn btn-outline border-2 border-neo-black hover:bg-neo-black hover:text-neo-white">
            BACK HOME
          </button>
        </header>

        <div className="grid gap-6">
          {events.length === 0 && (
            <div className="bg-neo-white p-12 border-3 border-neo-black shadow-neo text-center">
              <p className="text-gray-500 font-mono italic text-lg">No upcoming events right now. Check back soon!</p>
            </div>
          )}
          
          {events.map((event) => (
            <div key={event._id} className="bg-neo-white border-3 border-neo-black shadow-neo-xl p-6 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-neo-lg">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <HiTicket className="text-9xl text-neo-black" />
              </div>

              <div className="flex justify-between flex-wrap gap-6 relative z-10">
                <div className="flex-1">
                  <span className="inline-block px-2 py-1 bg-neo-accent border-2 border-neo-black text-xs font-bold uppercase mb-3">
                    {event.type}
                  </span>
                  <h2 className="text-2xl font-bold font-pixel text-neo-black mb-2">{event.name}</h2>
                  <p className="text-gray-700 font-mono mb-4 border-l-4 border-neo-secondary pl-3">{event.description}</p>
                  
                  <div className="flex gap-4 text-xs font-bold font-mono text-gray-600 uppercase flex-wrap">
                    <span className="bg-neo-bg px-2 py-1 border-2 border-neo-black">Category: {event.category}</span>
                    <span className="bg-neo-bg px-2 py-1 border-2 border-neo-black">
                      {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-between items-end min-w-[150px]">
                  <p className="text-sm font-bold font-mono text-neo-black mb-2 bg-neo-bg px-2 py-1 border-2 border-neo-black inline-block">
                    {event.participants?.length ?? 0} / {event.maxParticipants} REGISTERED
                  </p>
                  <button 
                    onClick={() => handleRegister(event._id)} 
                    className="btn btn-primary w-full shadow-neo hover:shadow-neo-sm"
                  >
                    REGISTER NOW
                  </button>
                </div>
              </div>

              {event.reward && (
                <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-300">
                  <p className="text-xs font-bold font-mono text-gray-500 uppercase mb-2">REWARDS</p>
                  <div className="flex gap-3">
                    {event.reward.badge && (
                      <span className="px-2 py-1 bg-neo-purple border-2 border-neo-black text-xs font-bold uppercase flex items-center gap-1">
                        🏅 {event.reward.badge}
                      </span>
                    )}
                    {event.reward.powerUp && (
                      <span className="px-2 py-1 bg-neo-accent border-2 border-neo-black text-xs font-bold uppercase flex items-center gap-1">
                        ⚡ {event.reward.powerUp}
                      </span>
                    )}
                    {event.reward.xp && (
                      <span className="px-2 py-1 bg-neo-green border-2 border-neo-black text-xs font-bold uppercase flex items-center gap-1">
                        💎 {event.reward.xp} XP
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Events;
