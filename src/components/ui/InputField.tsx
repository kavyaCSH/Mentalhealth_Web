import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
    containerClassName?: string;
}

const InputField: React.FC<InputFieldProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    helperText,
    containerClassName = '',
    className = '',
    ...props
}) => {
    return (
        <div className={`space-y-2 ${containerClassName}`}>
            {label && (
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200">
                        {leftIcon}
                    </div>
                )}

                <input
                    className={`
                        w-full bg-slate-50 border-2 border-transparent rounded-2xl py-4 transition-all duration-200 text-sm font-medium outline-none
                        focus:border-emerald-500 focus:bg-white
                        ${leftIcon ? 'pl-12' : 'px-5'}
                        ${rightIcon ? 'pr-12' : 'px-5'}
                        ${error ? 'border-red-200 bg-red-50 focus:border-red-500' : ''}
                        ${className}
                    `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {rightIcon}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {error ? (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-[10px] font-bold text-red-500 px-1"
                    >
                        {error}
                    </motion.p>
                ) : helperText ? (
                    <p className="text-[10px] font-bold text-slate-400 px-1">
                        {helperText}
                    </p>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default InputField;
