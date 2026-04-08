import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
    icon?: React.ElementType;
}

interface SelectProps {
    label?: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    error?: string;
}

const Select: React.FC<SelectProps> = ({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    className = '',
    error
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                    className={`w-full bg-page border-2 rounded-2xl p-4 text-left transition-all duration-200 flex items-center justify-between group
                        ${isOpen ? 'border-indigo-500 bg-card ring-4 ring-indigo-500/10' : 'border-border-card'}
                        ${error ? 'border-red-200 bg-red-500/10' : ''}
                    `}
                >
                    <div className="flex items-center gap-3">
                        {selectedOption?.icon && (
                            <selectedOption.icon size={18} className={`transition-colors ${isOpen ? 'text-indigo-500' : 'text-muted'}`} />
                        )}
                        <span className={`text-sm font-semibold ${selectedOption ? 'text-main' : 'text-muted'}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={18} className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : ''}`} />
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
                                {options.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
                                            ${value === option.value ? 'bg-indigo-500/10 text-indigo-500' : 'text-muted hover:bg-page hover:text-indigo-500'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {option.icon && (
                                                <option.icon size={16} />
                                            )}
                                            {option.label}
                                        </div>
                                        {value === option.value && <Check size={16} />}
                                    </button>
                                ))}
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

export default Select;
