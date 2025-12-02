const Button2 = ({ children, className = "", ...props }) => {
  return (
    <button 
      className={`px-6 py-2.5 text-sm font-semibold text-white 
        bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-purple-700/30
        backdrop-blur-md
        border border-white/30
        rounded-lg
        shadow-lg shadow-black/30
        hover:bg-gradient-to-br hover:from-purple-900/40 hover:via-purple-900/30 hover:to-purple-900/40
        hover:shadow-xl hover:shadow-purple-500/50
        hover:border-purple-400/50
        hover:scale-105
        transition-all duration-300
        relative overflow-hidden
        before:absolute before:inset-0 
        before:bg-gradient-to-br before:from-white/5 before:to-transparent
        before:pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button2;


