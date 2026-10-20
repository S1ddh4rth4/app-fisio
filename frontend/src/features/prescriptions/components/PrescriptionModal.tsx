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
    onSuccess: (savedPrescription: PrescriptionResponseDTO) => void;
    initialData?: PrescriptionResponseDTO | null;
}

export const PrescriptionModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialData = null,
}: PrescriptionModalProps) => {
    const isEditing = !!initialData;
    const [patientIdentifier, setPatientIdentifier] = useState('');
    const [title, setTitle] = useState('');
    const [generalInstructions, setGeneralInstructions] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [editReason, setEditReason] = useState('');
    const [granularModes, setGranularModes] = useState<{ [key: number]: boolean }>({});
    const [granularSets, setGranularSets] = useState<{ [key: number]: Array<{ reps: string; rm: string }> }>({});

    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);

    useEffect(() => {
        if (isOpen) {
            patientService.getAll().then(data => {
                const activePatients = data.filter(p => p.enabled);
                setPatientsList(activePatients);
                if (!isEditing && activePatients.length > 0 && !patientIdentifier) {
                    setPatientIdentifier(activePatients[0].username);
                }
            }).catch(() => { });

            if (initialData) {
                setPatientIdentifier(initialData.patientName.includes('@') ? initialData.patientName.split('@')[1].replace(')', '') : initialData.patientId);
                setTitle(initialData.title);
                setGeneralInstructions(initialData.generalInstructions || '');
                setStartDate(initialData.startDate);
                setEndDate(initialData.endDate || '');
                setItems(initialData.items && initialData.items.length > 0 ? initialData.items : [{
                    exerciseName: '',
                    sets: 3,
                    repetitions: '',
                    frequency: '',
                    notes: '',
                    videoUrl: '',
                }]);
            } else {
                setTitle('');
                setGeneralInstructions('');
                setEndDate('');
                setEditReason('');
                setItems([{
                    exerciseName: '',
                    sets: 3,
                    repetitions: '',
                    frequency: 'Diario',
                    notes: '',
                    videoUrl: '',
                }]);
            }
        }
    }, [isOpen, initialData]);

    const [items, setItems] = useState<PrescriptionItemDTO[]>([
        {
            exerciseName: '',
            sets: 3,
            repetitions: '',
            frequency: 'Diario',
            notes: '',
            videoUrl: '',
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
                repetitions: '',
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

    const handleSetsChange = (index: number, newSets: number) => {
        handleItemChange(index, 'sets', newSets);
        // Ajustar array granular si el modo granular está activo
        if (granularModes[index]) {
            const current = granularSets[index] || [];
            const updated = Array.from({ length: newSets }, (_, i) => current[i] || { reps: '10 reps', rm: '70% RM' });
            setGranularSets(prev => ({ ...prev, [index]: updated }));
            syncGranularToRepetitions(index, updated);
        }
    };

    const toggleGranular = (index: number, numSets: number) => {
        const nextState = !granularModes[index];
        setGranularModes(prev => ({ ...prev, [index]: nextState }));

        if (nextState) {
            const initial = Array.from({ length: numSets }, (_, i) => ({
                reps: i === 0 ? '15 reps' : i === 1 ? '6 reps' : i === 2 ? '10 reps' : 'Al fallo',
                rm: i === 0 ? '50% RM' : i === 1 ? '80% RM' : i === 2 ? '60% RM' : '30% RM',
            }));
            setGranularSets(prev => ({ ...prev, [index]: initial }));
            syncGranularToRepetitions(index, initial);
        } else {
            // Limpieza inmediata: si quita la opción, restaurar a un valor limpio estándar sin dejar el texto largo pegado
            handleItemChange(index, 'repetitions', '12 reps');
        }
    };

    const handleGranularChange = (itemIdx: number, setIdx: number, field: 'reps' | 'rm', value: string) => {
        const current = [...(granularSets[itemIdx] || [])];
        current[setIdx] = { ...current[setIdx], [field]: value };
        setGranularSets(prev => ({ ...prev, [itemIdx]: current }));
        syncGranularToRepetitions(itemIdx, current);
    };

    const syncGranularToRepetitions = (itemIdx: number, setsData: Array<{ reps: string; rm: string }>) => {
        const text = setsData
            .map((s, idx) => `S${idx + 1}: ${s.reps || '10 reps'} (${s.rm || 'RM'})`)
            .join(' • ');
        handleItemChange(itemIdx, 'repetitions', text);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload = {
                patientIdentifier,
                title,
                generalInstructions,
                startDate,
                endDate: endDate || undefined,
                editReason: isEditing ? (editReason || 'Ajuste de dosificación de ejercicios') : undefined,
                items: items.map(it => ({
                    ...it,
                    repetitions: it.repetitions || '10-12 repeticiones',
                })),
            };

            const saved = isEditing && initialData
                ? await prescriptionService.update(initialData.id, payload)
                : await prescriptionService.create(payload);

            onSuccess(saved);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al guardar la prescripción de ejercicios.');
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
                                        {p.fullName ? `${p.fullName} — @${p.username} (${p.email})` : `${p.username} (${p.email})`}
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

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                Series
                                            </label>
                                            <select
                                                value={item.sets}
                                                onChange={(e) => handleSetsChange(idx, parseInt(e.target.value, 10) || 1)}
                                                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 font-bold"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                    <option key={n} value={n}>{n} {n === 1 ? 'Serie' : 'Series'}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                Repeticiones Estándar
                                            </label>
                                            {granularModes[idx] ? (
                                                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-teal-700 truncate">
                                                    Dosificando por series abajo
                                                </div>
                                            ) : (
                                                <select
                                                    value={item.repetitions}
                                                    onChange={(e) => handleItemChange(idx, 'repetitions', e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 font-bold cursor-pointer"
                                                >
                                                    <option value="6 repeticiones">6 repeticiones</option>
                                                    <option value="8 repeticiones">8 repeticiones</option>
                                                    <option value="10 repeticiones">10 repeticiones</option>
                                                    <option value="12 repeticiones">12 repeticiones</option>
                                                    <option value="15 repeticiones">15 repeticiones</option>
                                                    <option value="20 repeticiones">20 repeticiones</option>
                                                    <option value="30 segundos">30 segundos (Isométrico)</option>
                                                    <option value="45 segundos">45 segundos (Isométrico)</option>
                                                    <option value="60 segundos">60 segundos (Isométrico)</option>
                                                    <option value="Al fallo muscular">Al fallo muscular</option>
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                                Frecuencia
                                            </label>
                                            <Input
                                                value={item.frequency || ''}
                                                onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                                                placeholder="ej. Diario, 2 veces al día"
                                            />
                                        </div>
                                    </div>

                                    {/* Dosificación Granular por Serie (% RM / Carga / Al Fallo) */}
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-teal-800 flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!granularModes[idx]}
                                                    onChange={() => toggleGranular(idx, item.sets)}
                                                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                                />
                                                Dosificar series individualmente (% RM, Fallo, Reps distintas)
                                            </label>
                                            {granularModes[idx] && (
                                                <span className="text-[10px] font-bold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-full">
                                                    {item.sets} series configurables
                                                </span>
                                            )}
                                        </div>

                                        {granularModes[idx] && (
                                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                                {(granularSets[idx] || []).map((sData, sIdx) => (
                                                    <div key={sIdx} className="flex items-center gap-2 text-xs">
                                                        <span className="font-extrabold text-slate-600 w-16 shrink-0">
                                                            Serie #{sIdx + 1}:
                                                        </span>
                                                        <select
                                                            value={sData.reps}
                                                            onChange={(e) => handleGranularChange(idx, sIdx, 'reps', e.target.value)}
                                                            className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                                                        >
                                                            <option value="6 reps">6 reps</option>
                                                            <option value="8 reps">8 reps</option>
                                                            <option value="10 reps">10 reps</option>
                                                            <option value="12 reps">12 reps</option>
                                                            <option value="15 reps">15 reps</option>
                                                            <option value="20 reps">20 reps</option>
                                                            <option value="Al fallo">Al fallo muscular</option>
                                                        </select>
                                                        <select
                                                            value={sData.rm}
                                                            onChange={(e) => handleGranularChange(idx, sIdx, 'rm', e.target.value)}
                                                            className="w-32 p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-teal-700 cursor-pointer"
                                                        >
                                                            <option value="30% RM">30% RM</option>
                                                            <option value="40% RM">40% RM</option>
                                                            <option value="50% RM">50% RM</option>
                                                            <option value="60% RM">60% RM</option>
                                                            <option value="70% RM">70% RM</option>
                                                            <option value="80% RM">80% RM</option>
                                                            <option value="85% RM">85% RM</option>
                                                            <option value="90% RM">90% RM</option>
                                                            <option value="Sin peso">Sin peso</option>
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                            Notas Técnicas e Indicaciones del Ejercicio
                                        </label>
                                        <textarea
                                            value={item.notes || ''}
                                            onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                                            rows={2}
                                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none resize-y"
                                            placeholder="ej. Mantener espalda recta, no arquear la columna lumbar, exhalar en el esfuerzo..."
                                        />
                                    </div>

                                    <div>
                                        <Input
                                            label="Enlace a Video Demostrativo (Opcional)"
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