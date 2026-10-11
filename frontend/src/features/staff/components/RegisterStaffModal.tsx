import { useState, type FormEvent } from 'react';
import { X, User, Mail, Lock, ShieldCheck, AlertCircle, Info, CheckCircle2, Copy, Check } from 'lucide-react';
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
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ROLE_FISIOTERAPEUTA');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [createdStaff, setCreatedStaff] = useState<StaffUserDTO | null>(null);
    const [savedTempPassword, setSavedTempPassword] = useState('');
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await staffService.createStaff({
                fullName: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                password,
                role,
            });
            setSavedTempPassword(password);
            setCreatedStaff(created);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al registrar al miembro del equipo. Verifica los datos.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCredentials = () => {
        if (!createdStaff) return;
        const text = `Bienvenido al equipo de AppFisio\nNombre: ${createdStaff.fullName || createdStaff.username}\nUsuario: ${createdStaff.username}\nCorreo: ${createdStaff.email}\nContraseña temporal: ${savedTempPassword}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleFinish = () => {
        if (createdStaff) {
            onSuccess(createdStaff);
        }
        setFullName('');
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('ROLE_FISIOTERAPEUTA');
        setErrorMsg(null);
        setCreatedStaff(null);
        setSavedTempPassword('');
        setCopied(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Alta de Personal Clínico</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Crea cuentas de acceso para fisioterapeutas, recepción o administradores</p>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {createdStaff ? (
                    <div className="mt-6 space-y-4 animate-in fade-in">
                        <div className="p-5 bg-teal-50/80 border border-teal-200 rounded-2xl text-center space-y-3">
                            <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-teal-950 text-lg">
                                ¡Personal Registrado con Éxito!
                            </h3>
                            <p className="text-xs text-teal-800 font-medium leading-relaxed">
                                Hemos enviado un correo de bienvenida con sus credenciales a <strong>{createdStaff.email}</strong>. También puedes copiarlas aquí:
                            </p>
                            <div className="p-3.5 bg-white border border-teal-200 rounded-xl text-left text-xs space-y-1.5 font-mono text-slate-800">
                                <p><strong>Usuario:</strong> {createdStaff.username}</p>
                                <p><strong>Correo:</strong> {createdStaff.email}</p>
                                <p><strong>Clave Temporal:</strong> <span className="text-teal-700 font-bold">{savedTempPassword}</span></p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyCredentials}
                                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-3 rounded-xl bg-white hover:bg-teal-100/60 text-teal-800 border border-teal-300 text-xs font-bold transition cursor-pointer"
                            >
                                {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-teal-600" />}
                                {copied ? '¡Credenciales copiadas!' : 'Copiar credenciales para WhatsApp'}
                            </button>
                        </div>

                        <Button
                            type="button"
                            variant="primary"
                            size="md"
                            className="w-full"
                            onClick={handleFinish}
                        >
                            Finalizar y Volver al Directorio
                        </Button>
                    </div>
                ) : (
                    <>
                        {errorMsg && (
                            <div className="my-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <Input
                                label="Nombre y Apellidos"
                                required
                                placeholder="ej. Lic. Carlos Mendoza"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                leftIcon={<User className="w-5 h-5" />}
                            />

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
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                    Rol y Privilegios en la Clínica
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full h-11 pl-11 pr-4 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                                    >
                                        <option value="ROLE_FISIOTERAPEUTA">Fisioterapeuta (Citas, Pacientes, Historias y Prescripciones)</option>
                                        <option value="ROLE_RECEPCION">Recepción (Agenda de Citas y Pagos)</option>
                                        <option value="ROLE_ADMIN">Administrador (Control total del sistema)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-800">
                                <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                                <span>
                                    <strong>Envío automático + Seguridad:</strong> El nuevo integrante recibirá sus credenciales por correo electrónico y, al iniciar sesión por primera vez, el sistema le pedirá crear su contraseña definitiva.
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <Button type="button" variant="outline" size="md" onClick={handleFinish}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                                    Dar de Alta Personal
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};