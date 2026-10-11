import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            id,
            className = '',
            required,
            disabled,
            ...props
        },
        ref
    ) => {
        // Generar un ID fallback si no se proporciona uno
        const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

        return (
            <div className="w-full text-left">
                {/* Etiqueta visible y de alto contraste (Claro y Oscuro) */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-bold text-slate-700 mb-1.5"
                    >
                        {label}
                        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>
                )}

                <div className="relative rounded-xl">
                    {/* Ícono izquierdo */}
                    {leftIcon && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            {leftIcon}
                        </div>
                    )}

                    {/* Campo de entrada táctil (h-12 = 48px) */}
                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={`
              w-full h-12 bg-white text-slate-900 placeholder:text-slate-400
              text-base rounded-xl border border-slate-300 transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
              ${leftIcon ? 'pl-11' : 'pl-4'}
              ${rightIcon || error ? 'pr-11' : 'pr-4'}
              ${error
                                ? 'border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-400/30'
                                : 'border-slate-300 hover:border-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-500/20'
                            }
              ${className}
            `}
                        {...props}
                    />

                    {/* Ícono derecho o ícono de error */}
                    {error ? (
                        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    ) : (
                        rightIcon && (
                            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                                {rightIcon}
                            </div>
                        )
                    )}
                </div>

                {/* Mensaje de error accesible */}
                {error ? (
                    <p className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1">
                        <span>{error}</span>
                    </p>
                ) : helperText ? (
                    <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = 'Input';