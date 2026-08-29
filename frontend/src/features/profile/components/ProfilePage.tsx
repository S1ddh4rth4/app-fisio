import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../services/profileService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
    User,
    Mail,
    ShieldCheck,
    KeyRound,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Check,
    X
} from 'lucide-react';

export const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reglas de seguridad en tiempo real
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSuccessMsg(null);

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
            const res = await profileService.changePassword({
                currentPassword,
                newPassword,
            });
            setSuccessMsg(res.message || 'Contraseña actualizada con éxito.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al actualizar contraseña. Verifica tu contraseña actual.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    Mi Cuenta
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    Perfil de Usuario
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                    Consulta tu información personal, roles y seguridad de acceso.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarjeta 1: Información de la Cuenta */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-600" />
                            Datos de Usuario
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Nombre de Usuario
                                </span>
                                <p className="text-base font-semibold text-slate-900">{user?.username}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Correo Electrónico
                                </span>
                                <p className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {user?.email || 'No registrado'}
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Roles & Permisos
                                </span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user?.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-3 py-1 rounded-xl flex items-center gap-1"
                                        >
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            {role.replace('ROLE_', '')}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <Button
                            variant="outline"
                            size="md"
                            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            onClick={logout}
                            leftIcon={<LogOut className="w-5 h-5" />}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>

                {/* Tarjeta 2: Cambiar Contraseña & Asistente */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-teal-600" />
                        Seguridad & Contraseña
                    </h2>

                    {successMsg && (
                        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-sm text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Caja de Consejos de Seguridad */}
                    <div className="mb-5 p-4 bg-teal-50/70 border border-teal-200/70 rounded-2xl">
                        <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1.5">
                            <Lightbulb className="w-4 h-4 text-teal-600" />
                            ¿Cómo crear una contraseña segura?
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                            💡 <strong>Tip pro:</strong> En lugar de una palabra simple, usa una <em>frase memorable</em> combinando palabras, números y símbolos (ejemplo: <span className="font-mono text-teal-900 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">Fisio.Fuerte#2026</span>).
                        </p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input
                            label="Contraseña Actual"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />

                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        {/* Checklist visual interactivo */}
                        {newPassword.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Mínimo 8 caracteres
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Una Mayúscula (A-Z)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Un Número (0-9)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Símbolo (!@#$%)
                                </span>
                            </div>
                        )}

                        <Input
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            required
                            placeholder="Repite la nueva contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                className="w-full"
                                isLoading={isLoading}
                                disabled={!isPasswordValid || newPassword !== confirmPassword || !currentPassword}
                            >
                                Actualizar Contraseña
                            </Button>

                            {newPassword.length > 0 && !isPasswordValid && (
                                <p className="text-[11px] text-amber-600 font-medium text-center mt-2">
                                    ⚠️ Completa los 4 requisitos de seguridad para activar el botón.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};