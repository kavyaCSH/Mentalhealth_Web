import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Pill, Wind, PenTool, Coffee, Clock } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    time: string;
    icon: any;
    color: string;
    bgColor: string;
    completed: boolean;
}

interface DailyTasksProps {
    initialTasks?: Task[];
}

const defaultTasks: Task[] = [
    { id: '1', title: 'Morning Medication', time: '08:00 AM', icon: Pill, color: 'text-rose-500', bgColor: 'bg-rose-50', completed: false },
    { id: '2', title: 'Mindful Breathing', time: '10:30 AM', icon: Wind, color: 'text-indigo-500', bgColor: 'bg-indigo-50', completed: true },
    { id: '3', title: 'Mid-day Journaling', time: '01:00 PM', icon: PenTool, color: 'text-emerald-500', bgColor: 'bg-emerald-50', completed: false },
    { id: '4', title: 'Hydration Goal', time: '02:30 PM', icon: Coffee, color: 'text-blue-500', bgColor: 'bg-blue-50', completed: false },
    { id: '5', title: 'Evening Reflection', time: '08:00 PM', icon: PenTool, color: 'text-purple-500', bgColor: 'bg-purple-50', completed: false },
];

const DailyTasks: React.FC<DailyTasksProps> = ({ initialTasks = defaultTasks }) => {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const toggleTask = (id: string) => {
        setTasks(prev => prev.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
        ));
    };

    const completedCount = tasks.filter(t => t.completed).length;
    const progress = (completedCount / tasks.length) * 100;

    return (
        <section className="card-premium p-8 bg-white border-slate-100 space-y-8 h-full flex flex-col shadow-2xl shadow-indigo-50/50">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-400" />
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Protocol</h2>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Wellness Routine</h3>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 leading-none">{completedCount}/{tasks.length}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Done</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50 shadow-inner">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    />
                </div>
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>In Progress</span>
                    <span className="text-indigo-600 italic">Target: 100%</span>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1">
                {tasks.map((task, i) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => toggleTask(task.id)}
                        className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-4 ${
                            task.completed 
                                ? 'bg-slate-50 border-slate-100 opacity-60' 
                                : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg shadow-sm'
                        }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${task.bgColor} ${task.color}`}>
                            <task.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold tracking-tight mb-0.5 truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {task.title}
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={10} /> {task.time}
                            </p>
                        </div>
                        <div className={`p-1 rounded-full transition-colors ${task.completed ? 'text-emerald-500' : 'text-slate-200 group-hover:text-indigo-400'}`}>
                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </div>
                    </motion.div>
                ))}
            </div>

            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
                Update Schedule
            </button>
        </section>
    );
};

export default DailyTasks;
