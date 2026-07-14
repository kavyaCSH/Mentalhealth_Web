import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-200 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95";

    const variants = {
        primary: "bg-indigo-600 text-white shadow-lg shadow-indigo-200/50 hover:bg-indigo-700",
        secondary: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
        outline: "bg-transparent border-2 border-border-card text-muted hover:border-indigo-600 hover:text-indigo-700",
        ghost: "bg-transparent text-muted hover:bg-page hover:text-main",
        danger: "bg-red-50 text-red-600 hover:bg-red-100",
        white: "bg-card text-main shadow-xl shadow-black/5 hover:bg-page",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs gap-2",
        md: "px-6 py-3.5 text-sm gap-2.5",
        lg: "px-8 py-5 text-base gap-3",
    };

    return (
        <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-inherit">
                    <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin"></div>
                </div>
            )}

            <div className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {leftIcon && <span className="shrink-0">{leftIcon}</span>}
                {children}
                {rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </div>
        </motion.button>
    );
};

export default Button; 
