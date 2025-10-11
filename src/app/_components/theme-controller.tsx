"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const ThemeController: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;

  const themes = [
    { name: 'Light', value: 'light', icon: '☀️' },
    { name: 'Dark', value: 'dark', icon: '🌙' },
    { name: 'Cupcake', value: 'cupcake', icon: '🧁' },
    { name: 'Cyberpunk', value: 'cyberpunk', icon: '🤖' },
    { name: 'Retro', value: 'retro', icon: '📼' },
    { name: 'Valentine', value: 'valentine', icon: '💖' },
  ];

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>
      <div tabIndex={0} className="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow">
        <div className="card-body">
          <h3 className="font-bold text-lg">Theme</h3>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                className={`btn ${theme === t.value ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setTheme(t.value)}
              >
                <span className="mr-2">{t.icon}</span>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeController;

