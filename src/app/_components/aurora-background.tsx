import React from 'react';

// Aurora background effect using Tailwind gradients and blur
const AuroraBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden">
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 w-[60vw] h-[60vw] -translate-x-1/2 bg-gradient-to-tr from-blue-400 via-pink-300 to-purple-400 opacity-30 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 opacity-20 blur-2xl rounded-full" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export default AuroraBackground;

