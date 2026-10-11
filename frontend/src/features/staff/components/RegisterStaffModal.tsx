import { useState, type FormEvent } from 'react';
import { X, User, Mail, Lock, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { staffService } from '../services/staffService';
import type { StaffUserDTO } from '../../../types/auth';

interface RegisterStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newStaff: StaffUserDTO) => void;
}

export const RegisterStaffModal = ({ isOpen, onClose, onSuccess }: RegisterStaffModalProps) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ROLE_FISIOTERAPEUTA');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await staffService.createStaff({
                username: username.trim(),
                email: email.trim(),
                password,
                role,
            });
            onSuccess(created);
            onClose();
            setUsername('');
            setEmail('');
            setPassword('');
            setRole('ROLE_FISIOTERAPEUTA');
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al registrar al miembro del equipo. Verifica los datos.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Alta de Personal Clínico</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Crea cuentas de acceso para fisioterapeutas, recepción o administradores</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="my-4 p-3.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800 dark:text-rose-300">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        label="Nombre de Usuario (Login)"
                        required
                        placeholder="ej. fisio_carlos"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        leftIcon={<User className="w-5 h-5" />}
                    />

                    <Input
                        label="Correo Electrónico Oficial"
                        type="email"
                        required
                        placeholder="ej. carlos.fisio@clinica.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail className="w-5 h-5" />}
                    />

                    <Input
                        label="Contraseña Temporal"
                        type="password"
                        required
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                    />

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                            Rol y Privilegios en la Clínica
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                            >
                                <option value="ROLE_FISIOTERAPEUTA">Fisioterapeuta (Citas, Pacientes, Historias y Prescripciones)</option>
                                <option value="ROLE_RECEPCION">Recepción (Agenda de Citas y Pagos)</option>
                                <option value="ROLE_ADMIN">Administrador (Control total del sistema)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-3 bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl flex items-start gap-2.5 text-xs text-teal-800 dark:text-teal-300">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>Seguridad activada:</strong> Al iniciar sesión con esta contraseña provisional, el sistema le pedirá de inmediato crear su contraseña definitiva.
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <Button type="button" variant="outline" size="md" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                            Dar de Alta Personal
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};