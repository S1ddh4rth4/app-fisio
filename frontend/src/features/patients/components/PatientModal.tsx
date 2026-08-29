import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { patientService } from '../services/patientService';
import type { PatientDTO } from '../../../types/patient';
import { X, User, Mail, Lock, AlertCircle } from 'lucide-react';

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newPatient: PatientDTO) => void;
}

export const PatientModal = ({ isOpen, onClose, onSuccess }: PatientModalProps) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await patientService.create({
                username,
                email,
                password: password || 'paciente123',
            });
            onSuccess(created);
            onClose();
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al registrar al paciente. Revisa que el usuario o email no existan.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Registrar Nuevo Paciente</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Crea la ficha del paciente para citas y expediente</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="my-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        label="Nombre de Usuario / Identificador"
                        required
                        placeholder="ej. lauragomez"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        leftIcon={<User className="w-5 h-5" />}
                    />

                    <Input
                        label="Correo Electrónico"
                        type="email"
                        required
                        placeholder="ej. laura@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail className="w-5 h-5" />}
                    />

                    <Input
                        label="Contraseña Inicial (Opcional)"
                        type="password"
                        placeholder="Por defecto: paciente123"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="w-5 h-5" />}
                        helperText="Si se deja vacío, la contraseña será paciente123"
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" size="md" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                            Registrar Paciente
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};