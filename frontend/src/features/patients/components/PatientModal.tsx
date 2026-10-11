import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { patientService } from '../services/patientService';
import type { PatientDTO } from '../../../types/patient';
import { X, User, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newPatient: PatientDTO) => void;
}

export const PatientModal = ({ isOpen, onClose, onSuccess }: PatientModalProps) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [acceptsPrivacyPolicy, setAcceptsPrivacyPolicy] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [createdPatient, setCreatedPatient] = useState<PatientDTO | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await patientService.create({
                fullName,
                email,
                acceptsPrivacyPolicy,
            });
            setCreatedPatient(created);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al registrar al paciente. Verifica que el correo no esté duplicado.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = () => {
        if (createdPatient) {
            onSuccess(createdPatient);
        }
        setFullName('');
        setEmail('');
        setAcceptsPrivacyPolicy(false);
        setErrorMsg(null);
        setCreatedPatient(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full">
                            Alta de Paciente
                        </span>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">Registrar Paciente</h2>
                    </div>
                    <button
                        onClick={handleFinish}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Si ya se creó, mostrar pantalla de confirmación */}
                {createdPatient ? (
                    <div className="mt-6 space-y-4 animate-in fade-in">
                        <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl text-center space-y-3">
                            <div className="w-12 h-12 bg-teal-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-teal-600/20">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-teal-950 text-lg">
                                ¡Paciente Registrado con Éxito!
                            </h3>
                            <p className="text-xs text-teal-800 font-medium leading-relaxed">
                                Comparte estas credenciales iniciales con el paciente para su primer ingreso (el sistema le solicitará cambiar su contraseña al entrar):
                            </p>
                            <div className="p-3 bg-white border border-teal-200 rounded-xl text-left text-xs space-y-1 font-mono text-slate-800">
                                <p><strong>Usuario:</strong> {createdPatient.username}</p>
                                <p><strong>Correo:</strong> {createdPatient.email}</p>
                                {createdPatient.temporaryPassword && (
                                    <p><strong>Clave Temporal:</strong> <span className="text-teal-700 font-bold">{createdPatient.temporaryPassword}</span></p>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="md"
                            className="w-full"
                            onClick={handleFinish}
                        >
                            Continuar con la Cita
                        </Button>
                    </div>
                ) : (
                    /* Formulario simple: Nombre y Correo */
                    <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <Input
                            label="Nombre Completo del Paciente"
                            required
                            placeholder="ej. Laura López"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            leftIcon={<User className="w-5 h-5 text-slate-400" />}
                            helperText="El sistema asignará llopez (o llopez1 si ya existe)"
                        />

                        <Input
                            label="Correo Electrónico"
                            type="email"
                            required
                            placeholder="ej. laura.lopez@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
                            helperText="El paciente podrá ingresar al sistema con este correo"
                        />

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                            <Send className="w-4 h-4 text-teal-600 shrink-0" />
                            <span>El paciente recibirá su acceso por correo electrónico automáticamente.</span>
                        </div>

                        {/* Casilla Obligatoria de Privacidad */}
                        <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                            <input
                                type="checkbox"
                                required
                                checked={acceptsPrivacyPolicy}
                                onChange={(e) => setAcceptsPrivacyPolicy(e.target.checked)}
                                className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                            />
                            <span className="text-xs text-slate-600 leading-relaxed">
                                Confirmo que el paciente ha leído y aceptado el{' '}
                                <button
                                    type="button"
                                    onClick={() => setIsPrivacyModalOpen(true)}
                                    className="text-teal-600 font-bold hover:underline hover:text-teal-700"
                                >
                                    Aviso de Privacidad
                                </button>
                                {' '}para el tratamiento de sus datos clínicos.
                            </span>
                        </label>

                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" size="md" onClick={handleFinish}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                                Registrar Paciente
                            </Button>
                        </div>
                    </form>
                )}

            </div>
            {/* Modal del Aviso de Privacidad */}
            <PrivacyPolicyModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
            />
        </div>
    );
};