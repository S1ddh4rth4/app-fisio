import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { prescriptionService } from '../services/prescriptionService';
import { PrescriptionModal } from './PrescriptionModal';
import { Button } from '../../../components/ui/Button';
import type { PrescriptionResponseDTO } from '../../../types/prescription';
import {
    Dumbbell,
    Plus,
    Calendar,
    User,
    Stethoscope,
    AlertCircle,
    Loader2,
    ExternalLink,
    CheckCircle2,
    Pencil,
    Trash2,
    Filter,
    ShieldAlert,
    X,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileText
} from 'lucide-react';

export const PrescriptionsPage = () => {
    const { user, hasRole } = useAuth();
    const isPatient = hasRole('ROLE_PACIENTE');
    const isStaff = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA');

    const [prescriptions, setPrescriptions] = useState<PrescriptionResponseDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState<PrescriptionResponseDTO | null>(null);
    const [selectedPatientFilter, setSelectedPatientFilter] = useState<string>('ALL');
    const [activeExerciseModal, setActiveExerciseModal] = useState<{
        prescription: PrescriptionResponseDTO;
        index: number;
    } | null>(null);
    const [completedSeries, setCompletedSeries] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);

    const toggleSeriesCheck = (key: string) => {
        setCompletedSeries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchPrescriptions = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = isPatient && user?.username
                ? await prescriptionService.getByPatient(user.username)
                : await prescriptionService.getAll();
            setPrescriptions(data);
        } catch (err: any) {
            setError('No se pudieron cargar las prescripciones.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
    }, [isPatient, user?.username]);

    const handleSaved = (saved: PrescriptionResponseDTO) => {
        setPrescriptions((prev) => {
            const exists = prev.some(p => p.id === saved.id);
            if (exists) {
                return prev.map(p => p.id === saved.id ? saved : p);
            }
            return [saved, ...prev];
        });
        setEditingPrescription(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta prescripción de ejercicios? Esta acción no se puede deshacer.')) {
            return;
        }
        try {
            await prescriptionService.delete(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
        } catch {
            alert('Error al eliminar la prescripción.');
        }
    };

    // Pacientes únicos para el filtro
    const uniquePatients = Array.from(
        new Set(prescriptions.map(p => p.patientName))
    );

    // Prescripciones filtradas
    const filteredPrescriptions = selectedPatientFilter === 'ALL'
        ? prescriptions
        : prescriptions.filter(p => p.patientName === selectedPatientFilter);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const nextStatus = currentStatus === 'ACTIVA' ? 'COMPLETADA' : 'ACTIVA';
        try {
            const updated = await prescriptionService.updateStatus(id, nextStatus);
            setPrescriptions((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
            );
        } catch {
            alert('No se pudo actualizar el estado de la prescripción.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                        Rehabilitación y Rutinas
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        Prescripción de Ejercicios
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        {isPatient
                            ? 'Consulta tus planes de rehabilitación y ejercicios asignados para realizar en casa.'
                            : 'Diseña y asigna programas de ejercicios personalizados para tus pacientes.'}
                    </p>
                </div>

                {isStaff && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsModalOpen(true)}
                        leftIcon={<Plus className="w-5 h-5" />}
                    >
                        Nueva Prescripción
                    </Button>
                )}
            </div>

            {/* Loading / Error / Empty states */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Cargando rutinas...</p>
                </div>
            ) : error ? (
                <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchPrescriptions}>
                        Reintentar
                    </Button>
                </div>
            ) : prescriptions.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                        <Dumbbell className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No hay prescripciones activas</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                        {isPatient
                            ? 'Tu fisioterapeuta aún no ha asignado rutinas de ejercicios para tu tratamiento.'
                            : 'Comienza creando la primera pauta de ejercicios para un paciente.'}
                    </p>
                    {isStaff && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsModalOpen(true)}
                            leftIcon={<Plus className="w-5 h-5" />}
                        >
                            Crear Primera Prescripción
                        </Button>
                    )}
                </div>
            ) : (
                /* Lista de Tarjetas de Prescripciones */
                <div className="space-y-4">
                    {/* Barra de Filtro de Paciente (Punto 15) */}
                    {isStaff && uniquePatients.length > 0 && (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-teal-600" />
                                <span className="text-xs font-bold text-slate-700 uppercase">Organizar por Paciente:</span>
                            </div>
                            <select
                                value={selectedPatientFilter}
                                onChange={(e) => setSelectedPatientFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                            >
                                <option value="ALL">Mostrar Todos ({prescriptions.length} rutinas)</option>
                                {uniquePatients.map((pName) => {
                                    const count = prescriptions.filter(p => p.patientName === pName).length;
                                    return (
                                        <option key={pName} value={pName}>
                                            {pName} ({count} {count === 1 ? 'rutina' : 'rutinas'})
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    {filteredPrescriptions.map((pres) => (
                        <div
                            key={pres.id}
                            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs transition-all space-y-4"
                        >
                            {/* Cabecera de la Prescripción */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-extrabold text-slate-900">{pres.title}</h3>
                                        <span
                                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${pres.status === 'ACTIVA'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-slate-100 text-slate-600 border-slate-300'
                                                }`}
                                        >
                                            {pres.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                                        <span className="flex items-center gap-1 font-medium">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            Paciente: <strong className="text-slate-700">{pres.patientName}</strong>
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                            Terapeuta: <strong className="text-slate-700">{pres.physiotherapistName}</strong>
                                        </span>
                                        <span className="flex items-center gap-1 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            Inicio: {pres.startDate} {pres.endDate ? `• Fin: ${pres.endDate}` : ''}
                                        </span>
                                    </div>
                                </div>

                                {isStaff && (
                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-slate-700"
                                            onClick={() => {
                                                setEditingPrescription(pres);
                                                setIsModalOpen(true);
                                            }}
                                            leftIcon={<Pencil className="w-3.5 h-3.5 text-slate-600" />}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                            onClick={() => handleDelete(pres.id)}
                                            leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                                        >
                                            Borrar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleToggleStatus(pres.id, pres.status)}
                                        >
                                            {pres.status === 'ACTIVA' ? 'Completar' : 'Activar'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Insignia de Auditoría Médica (Punto 9) */}
                            {pres.editReason && pres.editedBy && (
                                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold">Modificación Médica Registrada</span> (por {pres.editedBy} {pres.editedAt ? `el ${new Date(pres.editedAt).toLocaleDateString('es-MX')}` : ''}):
                                        <p className="italic text-amber-800 mt-0.5">"{pres.editReason}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Instrucciones generales */}
                            {pres.generalInstructions && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700">
                                    <strong className="block text-slate-900 uppercase text-[10px] font-bold mb-1">
                                        Indicaciones Generales
                                    </strong>
                                    {pres.generalInstructions}
                                </div>
                            )}

                            {/* Grid de Ejercicios Interactivos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {pres.items.map((item, idx) => {
                                    const seriesBreakdown = item.repetitions
                                        ? item.repetitions.split(' - ').map((s) => s.trim()).filter(Boolean)
                                        : [];

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveExerciseModal({ prescription: pres, index: idx })}
                                            className="p-4 sm:p-5 bg-teal-50/40 hover:bg-teal-50/80 rounded-2xl border border-teal-100 hover:border-teal-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-extrabold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                                                        {item.exerciseName}
                                                    </h4>
                                                    <span className="text-xs font-extrabold bg-teal-600 text-white px-2.5 py-1 rounded-xl shrink-0">
                                                        {item.sets} {item.sets === 1 ? 'serie' : 'series'}
                                                    </span>
                                                </div>

                                                {/* Desglose legible de series en móvil y escritorio */}
                                                {seriesBreakdown.length > 1 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {seriesBreakdown.map((serie, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-xs font-bold bg-white text-teal-900 border border-teal-200/80 px-2.5 py-1 rounded-lg"
                                                            >
                                                                {serie}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs font-bold bg-white text-teal-900 border border-teal-200/80 px-3 py-1.5 rounded-xl w-fit">
                                                        {item.sets} x {item.repetitions}
                                                    </div>
                                                )}

                                                {item.frequency && (
                                                    <p className="text-xs sm:text-sm text-teal-800 font-semibold flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                                        <span>Frecuencia: {item.frequency}</span>
                                                    </p>
                                                )}

                                                {item.notes && (
                                                    <p className="text-xs sm:text-sm text-slate-700 italic bg-white/70 p-2.5 rounded-xl border border-teal-100/80 line-clamp-2">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-3 mt-3 border-t border-teal-100/80 flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-teal-700 group-hover:underline">
                                                    Tocar para abrir detalle
                                                </span>
                                                {item.videoUrl && (
                                                    <a
                                                        href={item.videoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-2.5 py-1 rounded-lg transition"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Video
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Interactivo de Ejercicio / Entrenamiento (Optimizado para Móvil) */}
            {activeExerciseModal && (() => {
                const { prescription, index } = activeExerciseModal;
                const currentItem = prescription.items[index];
                if (!currentItem) return null;

                const seriesList = currentItem.repetitions
                    ? currentItem.repetitions.split(' - ').map((s) => s.trim()).filter(Boolean)
                    : [`${currentItem.sets} x ${currentItem.repetitions}`];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                            {/* Cabecera del Modal */}
                            <div className="px-5 py-4 bg-teal-600 text-white flex items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider bg-teal-700/80 px-2.5 py-0.5 rounded-full">
                                        Ejercicio {index + 1} de {prescription.items.length}
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-extrabold mt-1">
                                        {currentItem.exerciseName}
                                    </h3>
                                    <p className="text-xs text-teal-100 font-medium">
                                        Rutina: {prescription.title}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setActiveExerciseModal(null)}
                                    className="p-2 text-teal-100 hover:text-white hover:bg-teal-700 rounded-full transition cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Cuerpo del Ejercicio */}
                            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase block">
                                            Total de Series
                                        </span>
                                        <span className="text-base sm:text-lg font-extrabold text-slate-900">
                                            {currentItem.sets} {currentItem.sets === 1 ? 'Serie' : 'Series'}
                                        </span>
                                    </div>
                                    <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-200">
                                        <span className="text-[11px] font-bold text-teal-700 uppercase block">
                                            Frecuencia
                                        </span>
                                        <span className="text-sm sm:text-base font-extrabold text-teal-900">
                                            {currentItem.frequency || 'Según indicación'}
                                        </span>
                                    </div>
                                </div>

                                {/* Lista interactiva de Series para marcar avance */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-extrabold uppercase text-slate-700">
                                            Desglose de Series (Toca para marcar tu avance)
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {seriesList.map((serieText, sIdx) => {
                                            const checkKey = `${prescription.id}-${index}-${sIdx}`;
                                            const isDone = Boolean(completedSeries[checkKey]);
                                            return (
                                                <div
                                                    key={sIdx}
                                                    onClick={() => toggleSeriesCheck(checkKey)}
                                                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition select-none ${isDone
                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                                        : 'bg-white border-slate-200 hover:border-teal-300 text-slate-900'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className={`w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center ${isDone
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                                                            }`}>
                                                            {sIdx + 1}
                                                        </span>
                                                        <span className={`text-sm sm:text-base font-bold ${isDone ? 'line-through opacity-75' : ''}`}>
                                                            {serieText}
                                                        </span>
                                                    </div>
                                                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${isDone ? 'text-emerald-600' : 'text-slate-300'}`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Indicaciones específicas del ejercicio */}
                                {currentItem.notes && (
                                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
                                        <span className="text-xs font-extrabold uppercase text-amber-900 flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-amber-700" />
                                            Indicaciones del Fisioterapeuta
                                        </span>
                                        <p className="text-sm sm:text-base text-amber-950 font-medium leading-relaxed">
                                            {currentItem.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Indicaciones generales de la rutina */}
                                {prescription.generalInstructions && (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                                        <span className="text-xs font-bold uppercase text-slate-500 block">
                                            Indicaciones Generales de la Rutina
                                        </span>
                                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                                            {prescription.generalInstructions}
                                        </p>
                                    </div>
                                )}

                                {currentItem.videoUrl && (
                                    <a
                                        href={currentItem.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition shadow-xs"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Abrir Video Tutorial del Ejercicio
                                    </a>
                                )}
                            </div>

                            {/* Pie con navegación entre ejercicios de la misma rutina */}
                            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={index === 0}
                                    onClick={() => setActiveExerciseModal({ prescription, index: index - 1 })}
                                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                                >
                                    Anterior
                                </Button>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setActiveExerciseModal(null)}
                                >
                                    Cerrar
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={index >= prescription.items.length - 1}
                                    onClick={() => setActiveExerciseModal({ prescription, index: index + 1 })}
                                    rightIcon={<ChevronRight className="w-4 h-4" />}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal para Crear o Editar Prescripción */}
            <PrescriptionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingPrescription(null);
                }}
                onSuccess={handleSaved}
                initialData={editingPrescription}
            />
        </div>
    );
};