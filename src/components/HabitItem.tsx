import React from 'react';
import { Habit, HabitLog } from '../types';
import { CheckCircle2, Circle, Plus, Minus, MoreVertical, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/error-handler';
import { OperationType } from '../types';
import toast from 'react-hot-toast';

interface HabitItemProps {
  key?: React.Key;
  habit: Habit;
  log?: HabitLog;
  onUpdateCount: (delta: number) => void | Promise<void>;
}

export function HabitItem({ habit, log, onUpdateCount }: HabitItemProps) {
  const currentCount = log?.count || 0;
  const isDone = currentCount >= habit.goalValue;
  const progress = Math.min(100, (currentCount / habit.goalValue) * 100);

  const handleDelete = async () => {
    if (!window.confirm('Excluir este hábito?')) return;
    try {
      await deleteDoc(doc(db, 'habits', habit.id));
      toast.success('Hábito excluído');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `habits/${habit.id}`);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "group relative flex items-center bg-white p-4 rounded-3xl border transition-all duration-300",
        isDone ? "border-[#3B6D11]/30 bg-[#3B6D11]/5" : "border-black/5 hover:border-[#3B6D11]/20 shadow-sm"
      )}
    >
      <button 
        onClick={() => onUpdateCount(isDone ? -habit.goalValue : habit.goalValue)}
        className={cn(
          "mr-4 transition-colors",
          isDone ? "text-[#3B6D11]" : "text-[#B4B2A9] hover:text-[#3B6D11]"
        )}
      >
        {isDone ? <CheckCircle2 size={32} /> : <Circle size={32} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={cn(
            "font-medium text-lg leading-tight truncate",
            isDone && "text-[#3B6D11] line-through opacity-70"
          )}>
            {habit.name}
          </h4>
          <span className="text-xs font-mono text-[#888780] bg-[#F1EFE8] px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
            {currentCount} / {habit.goalValue}
          </span>
        </div>

        {habit.goalValue > 1 && (
          <div className="mt-2 space-y-1.5">
            <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className={cn(
                  "h-full transition-colors",
                  isDone ? "bg-[#3B6D11]" : "bg-[#97C459]"
                )}
              />
            </div>
            {!isDone && (
              <div className="flex gap-2">
                <button 
                  onClick={() => onUpdateCount(1)}
                  className="p-1 px-3 bg-[#F1EFE8] text-[#5F5E5A] rounded-full hover:bg-[#3B6D11] hover:text-white transition-all text-xs font-bold"
                >
                  Registar +1
                </button>
                {currentCount > 0 && (
                  <button 
                    onClick={() => onUpdateCount(-1)}
                    className="p-1 px-3 border border-[#D3D1C7] text-[#888780] rounded-full hover:bg-gray-50 transition-all text-xs font-bold"
                  >
                    Remover -1
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
        <button 
          onClick={handleDelete}
          className="p-2 text-[#B4B2A9] hover:text-red-500 rounded-full hover:bg-red-50"
          title="Excluir"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
}
