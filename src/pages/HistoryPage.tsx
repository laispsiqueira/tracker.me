import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Habit, HabitLog, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

export function HistoryPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).reverse();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid || 'guest-user';
    if (!currentUserId) return;

    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', currentUserId)
    );

    const unsubHabits = onSnapshot(habitsQuery, (snapshot) => {
      setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Habit[]);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habits'));

    const logsQuery = query(
      collection(db, 'habitLogs'),
      where('userId', '==', currentUserId)
    );

    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as HabitLog[]);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'habitLogs'));

    return () => {
      unsubHabits();
      unsubLogs();
    };
  }, [auth.currentUser]);

  const getLogForHabitAndDate = (habitId: string, date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    return logs.find(l => l.habitId === habitId && l.date === dStr);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-serif text-3xl text-[#3B6D11]">Seu Histórico</h2>
        <p className="text-[#888780] font-light">Visualize sua consistência nos últimos 7 dias.</p>
      </header>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B6D11]"></div>
        </div>
      ) : habits.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-black/5">
          <p className="text-[#888780]">Você ainda não tem hábitos registrados.</p>
        </div>
      ) : (
        <>
          {/* Week Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-8">
            {last7Days.map(date => {
              const di = date.getDay();
              const dStr = format(date, 'yyyy-MM-dd');
              const dayHabits = habits.filter(h => h.frequency.includes(di));
              const dayLogs = logs.filter(l => l.date === dStr);
              const done = dayHabits.filter(h => {
                const log = dayLogs.find(l => l.habitId === h.id);
                return (log?.count || 0) >= h.goalValue;
              }).length;
              const pct = dayHabits.length ? Math.round((done / dayHabits.length) * 100) : 0;
              const isToday = isSameDay(date, new Date());

              return (
                <div key={date.toISOString()} className={cn(
                  "bg-white rounded-2xl border p-4 text-center transition-all",
                  isToday ? "border-[#3B6D11] shadow-md ring-1 ring-[#3B6D11]/10" : "border-black/5 shadow-sm"
                )}>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#888780] mb-1">
                    {format(date, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={cn(
                    "text-2xl font-mono leading-none mb-1",
                    isToday ? "text-[#3B6D11]" : "text-[#444441]"
                  )}>
                    {format(date, 'd')}
                  </div>
                  <div className="text-[10px] font-mono text-[#888780] mb-3">
                    {dayHabits.length ? `${pct}%` : '–'}
                  </div>
                  <div className="h-1 bg-[#F1EFE8] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={cn("h-full rounded-full", pct === 100 ? "bg-[#3B6D11]" : "bg-[#97C459]")} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] font-bold uppercase tracking-widest text-[#888780] mb-4">detalhes por hábito</div>
          
          {/* Habit Details List */}
          <div className="space-y-3">
            {habits.map(habit => {
              // Calc 30 day streak or something? Simple: current streak
              let streak = 0;
              for (let i = 0; i < 30; i++) {
                const d = subDays(new Date(), i);
                const isSched = habit.frequency.includes(d.getDay());
                if (!isSched) continue;
                const log = getLogForHabitAndDate(habit.id, d);
                if (log && log.count >= habit.goalValue) streak++;
                else if (i > 0) break;
              }

              return (
                <div key={habit.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-serif text-xl">{habit.name}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#3B6D11] bg-[#3B6D11]/10 px-3 py-1 rounded-full">
                      {streak} dias seguidos
                    </span>
                  </div>
                  
                  <div className="flex gap-1">
                    {last7Days.map(date => {
                      const log = getLogForHabitAndDate(habit.id, date);
                      const isScheduled = habit.frequency.includes(date.getDay());
                      const isDone = log && log.count >= habit.goalValue;

                      return (
                        <div 
                          key={date.toISOString()} 
                          className={cn(
                            "flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold",
                            !isScheduled ? "border border-dashed border-[#D3D1C7] text-[#D3D1C7]" :
                            isDone ? "bg-[#3B6D11]/10 text-[#3B6D11]" : "bg-[#F1EFE8] text-[#B4B2A9]"
                          )}
                        >
                          {isScheduled ? (isDone ? '✓' : '✕') : '–'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Monthly Summary? (Maybe later) */}
      <section className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm">
          <h4 className="font-serif text-xl mb-4">Métricas do Mês</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#888780]">Total de check-ins</span>
              <span className="font-mono font-bold">{logs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#888780]">Dias ativos</span>
              <span className="font-mono font-bold">{new Set(logs.map(l => l.date)).size}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#EAF3DE] p-8 rounded-[2rem] border border-[#C0DD97]">
          <h4 className="font-serif text-xl text-[#3B6D11] mb-2">Dica de hoje</h4>
          <p className="text-sm text-[#3B6D11]/80 leading-relaxed">
            Consistência é melhor que perfeição. Se você perdeu um dia, não se preocupe. 
            O segredo é nunca faltar dois dias seguidos!
          </p>
        </div>
      </section>
    </div>
  );
}
