import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { treatmentService } from '../services/treatmentService';
import { TreatmentModal } from './TreatmentModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { TreatmentResponseDTO } from '../../../types/treatment';
import {
    Sparkles,
    Plus,
    Search,
    Clock,
    DollarSign,
    AlertCircle,
    Loader2,
    Pencil,
    Trash2,
    Filter,
    Stethoscope,
    Calendar,
    X,
    Info
} from 'lucide-react';

export const TreatmentsPage = () => {
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const canManageTreatments = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA');

    const [treatments, setTreatments] = useState<TreatmentResponseDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPhysioFilter, setSelectedPhysioFilter] = useState('ALL');
    const [selectedDetailTreatment, setSelectedDetailTreatment] = useState<TreatmentResponseDTO | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTreatment, setEditingTreatment] = useState<TreatmentResponseDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchTreatments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await treatmentService.getAll();
            setTreatments(data);
        } catch (err: any) {
            setError('No se pudo cargar el catálogo de tratamientos.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTreatments();
    }, []);

    const handleSaved = (saved: TreatmentResponseDTO) => {
        setTreatments((prev) => {
            const index = prev.findIndex((t) => t.id === saved.id);
            if (index >= 0) {
                const updated = [...prev];
                updated[index] = saved;
                return updated;
            }
            return [saved, ...prev];
        });
    };

    const handleEdit = (treatment: TreatmentResponseDTO) => {
        setEditingTreatment(treatment);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Estás seguro de eliminar el tratamiento "${name}"?`)) {
            return;
        }

        try {
            await treatmentService.delete(id);
            setTreatments((prev) => prev.filter((t) => t.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al eliminar el tratamiento.');
        }
    };

    // Fisioterapeutas únicos para el filtro
    const uniquePhysios = Array.from(
        new Set(treatments.map((t) => t.physiotherapistName || 'General (Clínica)'))
    );

    const filteredTreatments = treatments.filter((t) => {
        const matchesSearch =
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());
        const tPhysio = t.physiotherapistName || 'General (Clínica)';
        const matchesPhysio = selectedPhysioFilter === 'ALL' || tPhysio === selectedPhysioFilter;
        return matchesSearch && matchesPhysio;
    });

    return (
        <div className="space-y-6">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                        Servicios Clínicos
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        Catálogo de Tratamientos
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        Terapias especializadas, duración por sesión y costos vigentes.
                    </p>
                </div>

                {canManageTreatments && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => {
                            setEditingTreatment(null);
                            setIsModalOpen(true);
                        }}
                        leftIcon={<Plus className="w-5 h-5" />}
                    >
                        Nuevo Tratamiento
                    </Button>
                )}
            </div>

            {/* Buscador y Filtro por Profesional (Punto 1) */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar tratamiento por nombre o técnica..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                </div>

                {!hasRole('ROLE_PACIENTE') && uniquePhysios.length > 1 && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Filter className="w-4 h-4 text-teal-600" />
                        <select
                            value={selectedPhysioFilter}
                            onChange={(e) => setSelectedPhysioFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Terapeutas ({treatments.length})</option>
                            {uniquePhysios.map((pName) => {
                                const count = treatments.filter(t => (t.physiotherapistName || 'General (Clínica)') === pName).length;
                                return (
                                    <option key={pName} value={pName}>
                                        {pName} ({count})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}
            </div>

            {/* Listado de Tarjetas */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Cargando catálogo...</p>
                </div>
            ) : error ? (
                <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchTreatments}>
                        Reintentar
                    </Button>
                </div>
            ) : filteredTreatments.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {searchTerm ? 'No se encontraron tratamientos' : 'Catálogo sin tratamientos'}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                        {searchTerm
                            ? 'Prueba con otro término de búsqueda.'
                            : 'Comienza dando de alta el primer servicio de la clínica.'}
                    </p>
                    {!searchTerm && canManageTreatments && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setEditingTreatment(null);
                                setIsModalOpen(true);
                            }}
                            leftIcon={<Plus className="w-5 h-5" />}
                        >
                            Agregar Primer Tratamiento
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredTreatments.map((treatment) => (
                        <div
                            key={treatment.id}
                            onClick={() => setSelectedDetailTreatment(treatment)}
                            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-teal-700 transition-colors">
                                        {treatment.name}
                                    </h3>
                                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-xl shrink-0 flex items-center">
                                        <DollarSign className="w-3.5 h-3.5 -mr-0.5" />
                                        {treatment.price}
                                    </span>
                                </div>

                                {treatment.physiotherapistName && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2">
                                        <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                                        <span>{treatment.physiotherapistName}</span>
                                    </div>
                                )}

                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">
                                    {treatment.description}
                                </p>
                            </div>

                            <div>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                                        <Clock className="w-4 h-4 text-teal-600" />
                                        {treatment.durationMinutes} minutos
                                    </span>

                                    <span className="text-teal-600 font-semibold">
                                        Sesión Presencial
                                    </span>
                                </div>

                                {/* Acciones de Administración y Fisioterapeuta (Editar / Borrar) */}
                                {canManageTreatments && (
                                    <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleEdit(treatment)}
                                            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                                            title="Editar Tratamiento"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(treatment.id, treatment.name)}
                                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                                            title="Eliminar Tratamiento"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Detalle Completo para Pacientes y Staff (Punto 7) */}
            {selectedDetailTreatment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-base">{selectedDetailTreatment.name}</h3>
                                    <p className="text-xs text-teal-700 font-semibold">{selectedDetailTreatment.physiotherapistName || 'Clínica General'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDetailTreatment(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">Duración</span>
                                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-teal-600" />
                                        {selectedDetailTreatment.durationMinutes} minutos
                                    </span>
                                </div>
                                <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
                                    <span className="text-[11px] font-bold text-teal-700 uppercase block mb-0.5">Precio por Sesión</span>
                                    <span className="font-extrabold text-teal-900 text-sm flex items-center">
                                        <DollarSign className="w-4 h-4 text-teal-600 -mr-0.5" />
                                        {selectedDetailTreatment.price} MXN
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                                    <Info className="w-3.5 h-3.5 text-teal-600" />
                                    Descripción y Técnica Terapéutica
                                </h4>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-[220px] overflow-y-auto">
                                    {selectedDetailTreatment.description}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedDetailTreatment(null)}>
                                Cerrar
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    setSelectedDetailTreatment(null);
                                    navigate('/appointments');
                                }}
                                leftIcon={<Calendar className="w-4 h-4" />}
                            >
                                Agendar Cita
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {canManageTreatments && (
                <TreatmentModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTreatment(null);
                    }}
                    onSuccess={handleSaved}
                    initialData={editingTreatment}
                />
            )}
        </div>
    );
};