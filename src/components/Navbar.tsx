import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { LogOut, Calendar, LayoutGrid, User as UserIcon, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentPage: 'dashboard' | 'history';
  onNavigate: (page: 'dashboard' | 'history') => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const user = auth.currentUser || { displayName: 'Convidado', email: 'guest@tracker.me', photoURL: null };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-black/10 px-6 h-14 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="font-serif text-xl text-[#3B6D11] tracking-tighter">
          tracker<span className="text-[#888780]">.me</span>
        </h1>
      </div>

      <div className="flex bg-[#F1EFE8] p-1 rounded-full gap-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={cn(
            "px-5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200",
            currentPage === 'dashboard' ? "bg-[#3B6D11] text-white shadow-sm" : "text-[#888780] hover:text-[#5F5E5A]"
          )}
        >
          hoje
        </button>
        <button
          onClick={() => onNavigate('history')}
          className={cn(
            "px-5 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200",
            currentPage === 'history' ? "bg-[#3B6D11] text-white shadow-sm" : "text-[#888780] hover:text-[#5F5E5A]"
          )}
        >
          histórico
        </button>
      </div>

      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-[#F1EFE8] transition-colors border border-transparent hover:border-black/5"
        >
          <div className="hidden md:block text-right">
            <p className="text-[11px] font-bold leading-none text-[#444441]">{user?.displayName}</p>
          </div>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-black/5" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11]">
              <UserIcon size={16} />
            </div>
          )}
          <ChevronDown size={14} className={cn("text-[#888780] transition-transform", isMenuOpen && "rotate-180")} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl shadow-black/10 border border-black/5 p-2 overflow-hidden"
            >
              <div className="px-3 py-2 mb-1 border-b border-black/5 md:hidden">
                <p className="text-xs font-bold text-[#444441]">{user?.displayName}</p>
                <p className="text-[10px] text-[#888780] truncate">{user?.email}</p>
              </div>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut(auth);
                  // Since we are forcing a guest user in App.tsx, we might need a page reload to truly "logout" from the guest state
                  window.location.reload();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors font-medium text-left"
              >
                <LogOut size={16} />
                Sair da conta
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
