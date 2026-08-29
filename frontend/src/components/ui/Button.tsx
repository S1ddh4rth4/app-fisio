import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
}

export const Button = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) => {
    const variantStyles: Record<ButtonVariant, string> = {
        primary:
            'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-sm shadow-teal-600/20 border border-transparent focus-visible:ring-teal-500',
        secondary:
            'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/80 focus-visible:ring-slate-400',
        outline:
            'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-xs focus-visible:ring-teal-500',
        danger:
            'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-600/20 border border-transparent focus-visible:ring-rose-500',
        ghost:
            'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent focus-visible:ring-slate-400',
    };

    const sizeStyles: Record<ButtonSize, string> = {
        sm: 'h-10 px-3.5 text-sm rounded-xl gap-2',
        md: 'h-12 px-5 text-base rounded-xl gap-2.5',
        lg: 'h-14 px-6 text-lg rounded-2xl gap-3 font-semibold',
    };

    return (
        <button
            disabled={disabled || isLoading}
            className={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 cursor-pointer select-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
        active:scale-[0.99]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
            ) : (
                leftIcon && <span className="shrink-0">{leftIcon}</span>
            )}

            <span>{children}</span>

            {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </button>
    );
};