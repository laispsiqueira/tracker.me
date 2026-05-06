import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User, signInAnonymously, updateProfile } from 'firebase/auth';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/HistoryPage';
import { Navbar } from './components/Navbar';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'history'>('dashboard');

  useEffect(() => {
    // Forçamos um usuário convidado local para remover a tela de login e evitar o erro de operação restrita
    setUser({
      uid: 'guest-user',
      displayName: 'Convidado',
      email: 'guest@tracker.me',
      photoURL: null
    } as any);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-serif text-[#3B6D11]"
        >
          hábitos...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-2xl font-serif text-[#3B6D11]"
        >
          carregando...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1EFE8] font-sans text-[#444441]">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {currentPage === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <HistoryPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Toaster position="bottom-center" />
    </div>
  );
}
