import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RetroBackground from "../components/RetroBackground";
import Sidebar from "../components/Sidebar";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
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
          <h2 className="text-neo-black text-xl font-mono font-bold uppercase">Login to the Arena</h2>
        </header>
        
        {error && <div className="error-message font-mono text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit}>
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
              disabled={loading}
              className="neo-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full shadow-neo hover:shadow-neo-sm hover:translate-x-1 hover:translate-y-1 transition-all">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <p className="text-center mt-6 text-neo-black font-mono text-sm">
          Don't have an account? <Link to="/register" className="text-neo-primary font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
