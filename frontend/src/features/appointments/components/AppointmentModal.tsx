import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../../patients/services/patientService';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import type { PatientDTO } from '../../../types/patient';
import { X, Calendar, User, Stethoscope, FileText, AlertCircle } from 'lucide-react';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAppointment: AppointmentResponseDTO) => void;
}

export const AppointmentModal = ({ isOpen, onClose, onSuccess }: AppointmentModalProps) => {
    const { user, hasRole } = useAuth();
    const isPatient = hasRole('ROLE_PACIENTE');

    const [patientId, setPatientId] = useState(isPatient ? user?.username || '' : '');
    const [professionalId, setProfessionalId] = useState('fisio1');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [reason, setReason] = useState('');
    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (isPatient) {
                setPatientId(user?.username || '');
            } else {
                // Cargar lista de pacientes si es staff
                patientService.getAll().then((data) => {
                    setPatientsList(data);
                    if (data.length > 0 && !patientId) {
                        setPatientId(data[0].username);
                    }
                }).catch(() => { });
            }
        }
    }, [isOpen, isPatient, user?.username]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await appointmentService.create({
                patientId,
                professionalId,
                appointmentDate,
                reason,
            });
            onSuccess(created);
            onClose();
            if (!isPatient) setPatientId('');
            setAppointmentDate('');
            setReason('');
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al agendar la cita. Verifica que la fecha sea futura.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Agendar Nueva Cita</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Completa los datos de la sesión clínica</p>
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
                    {/* Selector de Paciente */}
                    {isPatient ? (
                        <Input
                            label="Paciente"
                            value={user?.username}
                            disabled
                            leftIcon={<User className="w-5 h-5" />}
                            helperText="Cita a tu nombre"
                        />
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Seleccionar Paciente <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative rounded-xl">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <select
                                    required
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    className="w-full h-12 bg-white text-slate-900 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="">-- Elige un paciente --</option>
                                    {patientsList.map((p) => (
                                        <option key={p.id} value={p.username}>
                                            {p.username} ({p.email})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <Input
                        label="ID / Usuario del Fisioterapeuta"
                        required
                        placeholder="ej. fisio1"
                        value={professionalId}
                        onChange={(e) => setProfessionalId(e.target.value)}
                        leftIcon={<Stethoscope className="w-5 h-5" />}
                    />

                    <Input
                        label="Fecha y Hora de la Sesión"
                        type="datetime-local"
                        required
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        leftIcon={<Calendar className="w-5 h-5" />}
                    />

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Motivo de Consulta / Diagnóstico <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                required
                                rows={3}
                                placeholder="ej. Rehabilitación de hombro post-operatorio sesión 1"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 py-3 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" size="md" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                            Confirmar Cita
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};