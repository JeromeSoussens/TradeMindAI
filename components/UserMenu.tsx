import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 focus:outline-none"
      >
        <div className="flex flex-col items-end hidden sm:block mr-1 leading-tight text-right">
          <span className="text-xs font-semibold text-slate-200 block">{user.name}</span>
          <span className="text-[10px] text-slate-500 font-medium block">{user.email}</span>
        </div>
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.name} className="w-8 h-8 rounded-full border border-slate-600 bg-slate-700 object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold border border-blue-500">
            {user.name.charAt(0)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-800/30">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          
          <button 
            onClick={() => signOut()}
            className="w-full text-left px-4 py-3 text-sm text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 flex items-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};