import { motion } from "framer-motion";

const RetroBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-neo-bg">
      {/* Dot Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#000000 2px, transparent 2px)",
          backgroundSize: "30px 30px"
        }}
      />

      {/* Grid Lines */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px),
                           linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />

      {/* Floating Elements */}
      <motion.div
        className="absolute top-20 left-20 w-16 h-16 border-4 border-neo-black opacity-20"
        animate={{
          rotate: 360,
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="absolute bottom-40 right-40 w-24 h-24 bg-neo-primary opacity-10 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute top-1/3 right-1/4 w-12 h-12 bg-neo-secondary opacity-20"
        style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
        animate={{
          rotate: -360,
          y: [0, 30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};

export default RetroBackground;
