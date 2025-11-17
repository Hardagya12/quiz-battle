import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600">
        <div className="text-white text-lg">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Live Events & Tournaments</h1>
            <p className="text-gray-600">Join limited-time playlists for unique rewards.</p>
          </div>
          <button onClick={() => navigate("/")} className="btn btn-outline">
            Back Home
          </button>
        </div>

        <div className="grid gap-6">
          {events.length === 0 && <p className="text-gray-600">No upcoming events right now. Check back soon!</p>}
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-xl shadow border border-gray-100 p-6">
              <div className="flex justify-between flex-wrap gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 font-semibold">{event.type}</p>
                  <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
                  <p className="text-gray-600 mb-3">{event.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>Category: {event.category}</span>
                    <span>
                      {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">
                    {event.participants?.length ?? 0}/{event.maxParticipants} registered
                  </p>
                  <button onClick={() => handleRegister(event._id)} className="btn btn-primary">
                    Register
                  </button>
                </div>
              </div>
              {event.reward && (
                <div className="mt-3 text-sm text-gray-600">
                  Rewards:{" "}
                  {event.reward.badge && <span className="mr-2">🏅 {event.reward.badge}</span>}
                  {event.reward.powerUp && <span className="mr-2">⚡ {event.reward.powerUp}</span>}
                  {event.reward.xp && <span>{event.reward.xp} XP</span>}
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


