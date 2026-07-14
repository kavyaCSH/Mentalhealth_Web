import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select options',
    className = '',
    error
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const removeOption = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    return (
        <div className={`space-y-2 relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-black text-muted uppercase tracking-widest px-1">
                    {label}
                </label>
            )}

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full bg-page border-2 rounded-2xl p-4 min-h-[56px] text-left transition-all duration-200 flex items-center justify-between group
                        ${isOpen ? 'border-indigo-500 bg-card ring-4 ring-indigo-500/10' : 'border-border-card'}
                        ${error ? 'border-red-200 bg-red-500/10' : ''}
                    `}
                >
                    <div className="flex flex-wrap gap-2 items-center flex-1 pr-4">
                        {value.length === 0 ? (
                            <span className="text-sm font-semibold text-muted">
                                {placeholder}
                            </span>
                        ) : (
                            value.map(val => {
                                const opt = options.find(o => o.value === val);
                                return (
                                    <span key={val} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-lg text-xs font-bold border border-indigo-500/20">
                                        {opt ? opt.label : val}
                                        <div 
                                            role="button"
                                            onClick={(e) => removeOption(e, val)}
                                            className="hover:bg-indigo-500/20 rounded-full p-0.5 ml-1 transition-colors"
                                        >
                                            <X size={12} />
                                        </div>
                                    </span>
                                );
                            })
                        )}
                    </div>
                    <ChevronDown size={18} className={`text-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full z-50 bg-card rounded-2xl shadow-2xl border border-border-card overflow-hidden py-2 shadow-indigo-200/5"
                        >
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {options.map((option) => {
                                    const isSelected = value.includes(option.value);
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => toggleOption(option.value)}
                                            className={`w-full flex items-center justify-between p-3 px-4 transition-all
                                                ${isSelected ? 'bg-indigo-500/10 text-indigo-500 font-bold' : 'text-muted hover:bg-page hover:text-indigo-500'}
                                            `}
                                        >
                                            <span className="text-sm">{option.label}</span>
                                            {isSelected && <Check size={16} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <p className="text-[10px] font-bold text-red-500 px-1">{error}</p>
            )}
        </div>
    );
};

export default MultiSelect;
