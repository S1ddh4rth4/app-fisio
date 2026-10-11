import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { prescriptionService } from '../services/prescriptionService';
import { patientService } from '../../patients/services/patientService';
import type { PrescriptionItemDTO, PrescriptionResponseDTO } from '../../../types/prescription';
import type { PatientDTO } from '../../../types/patient';
import {
    Dumbbell,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    X,
    Video
} from 'lucide-react';

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newPrescription: PrescriptionResponseDTO) => void;
}

export const PrescriptionModal = ({
    isOpen,
    onClose,
    onSuccess,
}: PrescriptionModalProps) => {
    const [patientIdentifier, setPatientIdentifier] = useState('paciente1');
    const [title, setTitle] = useState('Plan de Fortalecimiento Lumbar');
    const [generalInstructions, setGeneralInstructions] = useState('Realizar los ejercicios de forma lenta y pausada. Suspender en caso de dolor punzante.');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    // ESTADO: Almacenaremos la lista de pacientes reales
    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);

    // EFECTO NUEVO: Descargar pacientes al abrir la ventana
    useEffect(() => {
        if (isOpen) {
            patientService.getAll().then(data => {
                // Filtramos para ocultar a los pacientes dados de baja (Soft Delete)
                const activePatients = data.filter(p => p.enabled);
                setPatientsList(activePatients);

                if (activePatients.length > 0) {
                    setPatientIdentifier(activePatients[0].username);
                }
            }).catch(() => { });
        }
    }, [isOpen]);

    const [items, setItems] = useState<PrescriptionItemDTO[]>([
        {
            exerciseName: 'Puente de Glúteos',
            sets: 3,
            repetitions: '12 repeticiones',
            frequency: '1 vez al día',
            notes: 'Apretar abdomen y glúteos al subir, mantener 2 segundos.',
            videoUrl: 'https://youtube.com',
        },
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            {
                exerciseName: '',
                sets: 3,
                repetitions: '10 reps',
                frequency: 'Diario',
                notes: '',
                videoUrl: '',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length <= 1) return;
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof PrescriptionItemDTO, value: any) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const created = await prescriptionService.create({
                patientIdentifier,
                title,
                generalInstructions,
                startDate,
                endDate: endDate || undefined,
                items,
            });

            onSuccess(created);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al emitir la prescripción de ejercicios.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                            <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Nueva Rutina de Ejercicios</h2>
                            <p className="text-xs text-slate-500">Prescribe un plan de rehabilitación para el hogar.</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Feedback Error */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800 shrink-0">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Formulario con Scroll */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                Paciente Asignado <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={patientIdentifier}
                                onChange={(e) => setPatientIdentifier(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                            >
                                <option value="" disabled>-- Selecciona un Paciente --</option>
                                {patientsList.map((p) => (
                                    <option key={p.id} value={p.username}>
                                        {p.username} ({p.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Título del Plan"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="ej. Rutina Lumbar Fase 1"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="Fecha de Inicio"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />

                        <Input
                            label="Fecha Límite / Revisión (Opcional)"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Instrucciones Generales y Precauciones
                        </label>
                        <textarea
                            value={generalInstructions}
                            onChange={(e) => setGeneralInstructions(e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                            placeholder="Recomendaciones clave..."
                        />
                    </div>

                    {/* Lista Dinámica de Ejercicios */}
                    <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Ejercicios Prescritos ({items.length})
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={handleAddItem}
                                leftIcon={<Plus className="w-4 h-4 text-teal-600" />}
                            >
                                Añadir Ejercicio
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                            #{idx + 1}
                                        </span>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <Input
                                        label="Nombre del Ejercicio"
                                        value={item.exerciseName}
                                        onChange={(e) => handleItemChange(idx, 'exerciseName', e.target.value)}
                                        placeholder="ej. Estiramiento Isquiotibial"
                                        required
                                    />

                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            label="Series"
                                            type="number"
                                            min="1"
                                            value={String(item.sets)}
                                            onChange={(e) => handleItemChange(idx, 'sets', parseInt(e.target.value, 10) || 1)}
                                            required
                                        />
                                        <Input
                                            label="Repeticiones"
                                            value={item.repetitions}
                                            onChange={(e) => handleItemChange(idx, 'repetitions', e.target.value)}
                                            placeholder="ej. 12 reps"
                                            required
                                        />
                                        <Input
                                            label="Frecuencia"
                                            value={item.frequency || ''}
                                            onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                                            placeholder="ej. Diario"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Input
                                            label="Notas / Indicaciones"
                                            value={item.notes || ''}
                                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                            placeholder="ej. Mantener espalda recta"
                                        />
                                        <Input
                                            label="Enlace a Video (URL)"
                                            value={item.videoUrl || ''}
                                            onChange={(e) => handleItemChange(idx, 'videoUrl', e.target.value)}
                                            placeholder="https://youtube.com/..."
                                            leftIcon={<Video className="w-4 h-4 text-slate-400" />}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                        <Button variant="outline" size="sm" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={isLoading}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            Guardar Prescripción
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
};