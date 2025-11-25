import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { HiHome, HiUser, HiTrophy, HiDocumentText, HiCalendar } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { RiMenu3Fill } from "react-icons/ri";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { 
      icon: HiHome, 
      label: "Home", 
      path: "/",
      gradient: "from-winter-ice to-winter-glacier"
    },
    { 
      icon: HiUser, 
      label: "Profile", 
      path: "/profile",
      gradient: "from-winter-aurora to-purple-500"
    },
    { 
      icon: HiTrophy, 
      label: "Leaderboard", 
      path: "/leaderboard",
      gradient: "from-yellow-400 to-orange-500"
    },
    { 
      icon: HiDocumentText, 
      label: "History", 
      path: "/history",
      gradient: "from-winter-frost to-cyan-400"
    },
    { 
      icon: HiCalendar, 
      label: "Events", 
      path: "/events",
      gradient: "from-pink-400 to-rose-500"
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-6 left-6 z-50 bg-neo-white p-3 border-3 border-neo-black shadow-neo hover:bg-neo-accent transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? (
          <IoClose className="w-6 h-6 text-neo-black" />
        ) : (
          <RiMenu3Fill className="w-6 h-6 text-neo-black" />
        )}
      </motion.button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-neo-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 z-50 bg-neo-white border-r-3 border-neo-black shadow-neo-xl"
          >
            <div className="p-8 h-full flex flex-col">
              {/* Header */}
              <div className="mb-12 border-b-3 border-neo-black pb-4">
                <h2 className="text-2xl font-pixel text-neo-black mb-2">
                  Quiz Battle
                </h2>
                <p className="text-neo-black font-mono text-xs uppercase tracking-widest">Navigate your journey</p>
              </div>

              {/* Menu Items */}
              <nav className="space-y-4 flex-1">
                {menuItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-full flex items-center gap-4 px-5 py-4 border-3 border-neo-black transition-all shadow-neo-sm hover:shadow-neo hover:-translate-y-1 ${
                        isActive(item.path)
                          ? "bg-neo-primary text-neo-black"
                          : "bg-neo-bg text-neo-black hover:bg-neo-secondary"
                      }`}
                    >
                      <IconComponent className="text-xl" />
                      <span className="font-bold font-mono text-sm uppercase">{item.label}</span>
                      {isActive(item.path) && (
                        <div className="ml-auto w-3 h-3 bg-neo-black border-2 border-neo-white" />
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Footer Stats */}
              <div className="mt-auto pt-6 border-t-3 border-neo-black">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neo-green border-3 border-neo-black p-3 shadow-neo-sm">
                    <p className="text-xs font-bold uppercase mb-1">Wins</p>
                    <p className="text-xl font-pixel">{user?.stats?.wins ?? 0}</p>
                  </div>
                  <div className="bg-neo-primary border-3 border-neo-black p-3 shadow-neo-sm">
                    <p className="text-xs font-bold uppercase mb-1">Losses</p>
                    <p className="text-xl font-pixel">{user?.stats?.losses ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
