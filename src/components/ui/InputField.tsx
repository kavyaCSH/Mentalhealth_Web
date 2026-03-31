import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

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
    type,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className={`space-y-2 ${containerClassName}`}>
            {label && (
                <label className="text-xs font-black text-muted uppercase tracking-widest px-1">
                    {label}
                </label>
            )}

            <div className="relative group">
                {leftIcon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors duration-200">
                        {leftIcon}
                    </div>
                )}

                <input
                    {...props}
                    type={inputType}
                    className={`
                        w-full bg-page border-2 border-transparent rounded-2xl py-4 transition-all duration-200 text-sm font-medium outline-none text-main
                        focus:border-indigo-500 focus:bg-card
                        ${leftIcon ? 'pl-12' : 'px-5'}
                        ${(rightIcon || isPassword) ? 'pr-12' : 'px-5'}
                        ${error ? 'border-red-200 bg-red-50 focus:border-red-500' : ''}
                        ${className}
                    `}
                />

                {(rightIcon || isPassword) && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isPassword && (
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="text-muted hover:text-indigo-500 transition-colors focus:outline-none p-1 rounded-lg hover:bg-slate-100/50"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        )}
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
                    <p className="text-[10px] font-bold text-muted px-1">
                        {helperText}
                    </p>
                ) : null}
            </AnimatePresence>
        </div>
    );
};

export default InputField;
