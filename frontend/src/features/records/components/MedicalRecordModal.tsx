import { useState, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { medicalRecordService } from '../services/medicalRecordService';
import type { MedicalRecordResponseDTO } from '../../../types/medicalRecord';
import { X, User, Activity, FileText, AlertCircle, Hash } from 'lucide-react';

interface MedicalRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newRecord: MedicalRecordResponseDTO) => void;
    defaultPatientId?: string;
}

export const MedicalRecordModal = ({
    isOpen,
    onClose,
    onSuccess,
    defaultPatientId = '',
}: MedicalRecordModalProps) => {
    const [patientId, setPatientId] = useState(defaultPatientId);
    const [appointmentId, setAppointmentId] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const created = await medicalRecordService.create({
                patientId,
                appointmentId: appointmentId ? Number(appointmentId) : undefined,
                diagnosis,
                notes,
            });
            onSuccess(created);
            onClose();
            setDiagnosis('');
            setNotes('');
            setAppointmentId('');
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al guardar la nota clínica. Verifica los datos.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Nueva Nota de Evolución Clínica</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Registro de diagnóstico y notas de sesión</p>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="ID del Paciente"
                            required
                            placeholder="ej. paciente1"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            leftIcon={<User className="w-5 h-5" />}
                        />

                        <Input
                            label="ID de Cita (Opcional)"
                            type="number"
                            placeholder="ej. 1"
                            value={appointmentId}
                            onChange={(e) => setAppointmentId(e.target.value)}
                            leftIcon={<Hash className="w-5 h-5" />}
                        />
                    </div>

                    <Input
                        label="Diagnóstico / Hallazgo Principal"
                        required
                        placeholder="ej. Tendinopatía aquilea izquierda en fase subaguda"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        leftIcon={<Activity className="w-5 h-5" />}
                    />

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Notas de la Sesión & Evolución <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                required
                                rows={4}
                                placeholder="Detalla la respuesta al tratamiento, movilidad articular, nivel de dolor (EVA), ejercicios realizados y recomendaciones domiciliarias..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 py-3 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" size="md" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                            Guardar Nota Clínica
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};