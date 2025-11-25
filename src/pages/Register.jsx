import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
      <RetroBackground />
      <Sidebar />
      
      <div className="bg-neo-white p-10 w-full max-w-md relative z-10 border-3 border-neo-black shadow-neo-xl">
        <header className="text-center mb-8">
          <h1 className="text-neo-black mb-2 text-4xl font-bold font-pixel">Quiz Battle</h1>
          <h2 className="text-neo-black text-xl font-mono font-bold uppercase">Join the Arena</h2>
        </header>
        
        {error && <div className="error-message font-mono text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="font-mono uppercase text-sm">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              disabled={loading}
              className="neo-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="font-mono uppercase text-sm">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="neo-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className="font-mono uppercase text-sm">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="neo-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword" className="font-mono uppercase text-sm">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="neo-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-neo hover:shadow-neo-sm hover:translate-x-1 hover:translate-y-1 transition-all">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        
        <p className="text-center mt-6 text-neo-black font-mono text-sm">
          Already have an account? <Link to="/login" className="text-neo-primary font-bold hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
