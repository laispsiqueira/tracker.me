import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { X, Check } from 'lucide-react';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError } from '../lib/error-handler';
import { OperationType } from '../types';
import toast from 'react-hot-toast';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = [
  { id: 0, label: 'D' },
  { id: 1, label: 'S' },
  { id: 2, label: 'T' },
  { id: 3, label: 'Q' },
  { id: 4, label: 'Q' },
  { id: 5, label: 'S' },
  { id: 6, label: 'S' },
];

export function AddHabitModal({ isOpen, onClose }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [goalValue, setGoalValue] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana.');
      return;
    }
    const currentUserId = auth.currentUser?.uid || 'guest-user';
    if (!currentUserId) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'habits'), {
        userId: currentUserId,
        name: name.trim(),
        goalValue,
        frequency: selectedDays,
        createdAt: Timestamp.now(),
        archived: false,
        color: '#3B6D11'
      });
      toast.success('Hábito criado com sucesso!');
      setName('');
      setGoalValue(1);
      setSelectedDays([1, 2, 3, 4, 5]);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'habits');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-serif text-3xl text-[#3B6D11]">Novo Hábito</h3>
            <button onClick={onClose} className="p-2 hover:bg-[#F1EFE8] rounded-full transition-colors text-[#888780]">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#888780] block ml-1">O que você quer rastrear?</label>
              <input
                autoFocus
                type="text"
                placeholder="Ex: Ler 10 páginas, Beber água..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F1EFE8] border-none rounded-2xl py-4 px-6 text-lg focus:ring-2 focus:ring-[#3B6D11] outline-none transition-all placeholder:text-[#B4B2A9]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[#888780] block ml-1">Meta diária</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setGoalValue(v => Math.max(1, v - 1))}
                    className="w-10 h-10 rounded-xl bg-[#F1EFE8] flex items-center justify-center text-[#5F5E5A] hover:bg-[#3B6D11] hover:text-white transition-all font-bold"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl font-serif">{goalValue}</span>
                    <span className="text-xs block text-[#888780]">vezes</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setGoalValue(v => v + 1)}
                    className="w-10 h-10 rounded-xl bg-[#F1EFE8] flex items-center justify-center text-[#5F5E5A] hover:bg-[#3B6D11] hover:text-white transition-all font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-[#888780] block ml-1">Dias da semana</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "w-9 h-9 rounded-xl text-xs font-bold transition-all",
                        selectedDays.includes(day.id) 
                          ? "bg-[#3B6D11] text-white shadow-md shadow-[#3B6D11]/20" 
                          : "bg-[#F1EFE8] text-[#888780] hover:bg-[#D3D1C7]"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-[#3B6D11] text-white py-4 rounded-[1.25rem] font-bold text-lg hover:bg-[#27500A] transition-all shadow-xl shadow-[#3B6D11]/20 disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Começar este hábito'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
