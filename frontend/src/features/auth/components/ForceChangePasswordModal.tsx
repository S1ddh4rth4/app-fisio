import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../../profile/services/profileService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
    ShieldAlert,
    KeyRound,
    AlertCircle,
    LogOut,
    Check,
    X,
    Eye,
    EyeOff,
    Sparkles
} from 'lucide-react';

export const ForceChangePasswordModal = () => {
    const { logout, clearMustChangePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!isPasswordValid) {
            setErrorMsg('La nueva contraseña debe cumplir con todos los requisitos de seguridad.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('Las nuevas contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        try {
            await profileService.changePassword({ currentPassword, newPassword });
            clearMustChangePassword();
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al actualizar. Verifica tu contraseña temporal.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-center mb-6">
                    <div className="mx-auto w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-2xl flex items-center justify-center mb-3 border border-amber-200 dark:border-amber-800">
                        <ShieldAlert className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Actualización Requerida</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Por motivos de seguridad y privacidad clínica, debes establecer tu contraseña personal antes de ingresar al sistema.
                    </p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-2 text-xs text-rose-800 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Contraseña Temporal Recibida"
                        type={showCurrent ? 'text' : 'password'}
                        required
                        placeholder="Ingresa la clave temporal"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        }
                    />

                    <div>
                        <Input
                            label="Nueva Contraseña Definitiva"
                            type={showNew ? 'text' : 'password'}
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />

                        {/* Checklist interactivo de requisitos de seguridad */}
                        {newPassword.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs p-3 mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                                <span className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Mínimo 8 caracteres
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasUppercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Una Mayúscula (A-Z)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Un Número (0-9)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasSpecialChar ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Símbolo (!@#$%)
                                </span>
                            </div>
                        )}

                        {/* Recomendación de ejemplo con alto contraste */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span>Ejemplo recomendado:</span>
                            <code className="bg-slate-100 dark:bg-slate-700 text-teal-700 dark:text-teal-300 font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                                Fisio#2026
                            </code>
                        </div>
                    </div>

                    <Input
                        label="Confirmar Nueva Contraseña"
                        type={showConfirm ? 'text' : 'password'}
                        required
                        placeholder="Repite la nueva clave"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
                        rightIcon={
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        }
                    />

                    <div className="pt-2 flex flex-col gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="w-full"
                            isLoading={isLoading}
                            disabled={!isPasswordValid || newPassword !== confirmPassword}
                        >
                            Establecer Contraseña y Continuar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-slate-500 dark:text-slate-400"
                            onClick={logout}
                            leftIcon={<LogOut className="w-4 h-4" />}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};