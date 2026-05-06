import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, setDoc, Timestamp, getDocs } from 'firebase/firestore';
import { format, addDays, subDays, startOfToday, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, Circle, Flame, Target, TrendingUp } from 'lucide-react';
import { Habit, HabitLog, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { HabitItem } from '../components/HabitItem';
import { AddHabitModal } from '../components/AddHabitModal';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, HabitLog>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayOfWeek = selectedDate.getDay();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid || 'guest-user';
    if (!currentUserId) return;

    // Fetch Habits - Optimized query
    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', currentUserId)
    );

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() })) as Habit[];
      
      // Filter archived habits in-memory to avoid composite index requirements
      const activeHabits = data.filter(h => !h.archived);
      setHabits(activeHabits.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setLoading(false);
    }, (err) => {
      console.error("Habit loading error:", err);
      handleFirestoreError(err, OperationType.LIST, 'habits');
    });

    // Fetch Logs for selected date
    const logsQuery = query(
      collection(db, 'habitLogs'),
      where('userId', '==', currentUserId),
      where('date', '==', dateStr)
    );

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsMap: Record<string, HabitLog> = {};
      snapshot.docs.forEach(doc => {
        const log = { id: doc.id, ...doc.data() } as HabitLog;
        logsMap[log.habitId] = log;
      });
      setLogs(logsMap);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habitLogs'));

    return () => {
      unsubHabits();
      unsubLogs();
    };
  }, [dateStr, auth.currentUser]);

  const habitsForDay = habits.filter(h => h.frequency.includes(dayOfWeek));
  const completedCount = habitsForDay.filter(h => (logs[h.id]?.count || 0) >= h.goalValue).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia!';
    if (hour >= 12 && hour < 18) return 'Boa tarde!';
    if (hour >= 18 && hour < 22) return 'Boa noite!';
    return 'Boa madrugada!';
  };

  const handleUpdateCount = async (habitId: string, delta: number) => {
    const currentUserId = auth.currentUser?.uid || 'guest-user';
    if (!currentUserId) return;
    
    // Future date check
    if (isAfter(selectedDate, startOfToday())) {
      toast.error('Não é possível registrar hábitos em datas futuras.');
      return;
    }

    const log = logs[habitId];
    const currentCount = log?.count || 0;
    const newCount = Math.max(0, currentCount + delta);
    const logId = log?.id || `${habitId}_${dateStr}`;

    try {
      await setDoc(doc(db, 'habitLogs', logId), {
        userId: currentUserId,
        habitId,
        date: dateStr,
        count: newCount,
        updatedAt: Timestamp.now()
      }, { merge: true });
      
      if (newCount >= habits.find(h => h.id === habitId)!.goalValue && currentCount < newCount) {
        toast.success('Hábito concluído!', { icon: '🎉' });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `habitLogs/${logId}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-serif text-3xl text-[#222222] mb-1">{getGreeting()}</h2>
        <p className="text-sm text-[#888780] font-light">Acompanhe seus hábitos do dia</p>
      </div>

      {/* Date Navigation */}
      <section className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-black/5">
        <button 
          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          className="p-2 hover:bg-[#F1EFE8] rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center flex flex-col items-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#888780] mb-0.5">
            {format(selectedDate, 'eee, d MMM', { locale: ptBR })}
          </div>
          <h2 className="font-serif text-xl capitalize leading-none pt-1">
            {format(selectedDate, 'EEEE', { locale: ptBR })}
          </h2>
        </div>

        <button 
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-2 hover:bg-[#F1EFE8] rounded-full transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#3B6D11] text-white p-4 rounded-2xl shadow-lg shadow-[#3B6D11]/10">
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">Sequência</div>
          <div className="text-2xl font-mono">7</div>
          <div className="text-[9px] mt-1 opacity-60">dias seguidos</div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#888780] mb-2">Hoje</div>
          <div className="text-2xl font-mono">{completedCount}/{habitsForDay.length}</div>
          <div className="text-[9px] mt-1 text-[#888780]">hábitos</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#888780] mb-2">Taxa</div>
          <div className="text-2xl font-mono">85%</div>
          <div className="text-[9px] mt-1 text-[#888780]">semanal</div>
        </div>
      </div>

      {/* Habits List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">hábitos de hoje</div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[11px] font-bold uppercase tracking-widest text-[#3B6D11] hover:underline"
          >
            + adicionar
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B6D11]"></div>
          </div>
        ) : habitsForDay.length === 0 ? (
          <div className="bg-white/50 border border-dashed border-[#D3D1C7] rounded-3xl p-12 text-center">
            <p className="text-[#888780]">Nenhum hábito agendado para hoje.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-[#3B6D11] font-medium hover:underline"
            >
              Criar meu primeiro hábito
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {habitsForDay.map(habit => (
                <HabitItem 
                  key={habit.id} 
                  habit={habit} 
                  log={logs[habit.id]} 
                  onUpdateCount={(delta) => handleUpdateCount(habit.id, delta)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <AddHabitModal 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
