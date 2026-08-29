import { useState, useEffect } from 'react';
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
    Trash2
} from 'lucide-react';

export const TreatmentsPage = () => {
    const { hasRole } = useAuth();
    const isAdmin = hasRole('ROLE_ADMIN');

    const [treatments, setTreatments] = useState<TreatmentResponseDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredTreatments = treatments.filter(
        (t) =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

                {isAdmin && (
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

            {/* Buscador */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <Input
                    placeholder="Buscar tratamiento por nombre o técnica..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                />
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
                    {!searchTerm && isAdmin && (
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
                            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h3 className="font-bold text-slate-900 text-lg leading-snug">
                                        {treatment.name}
                                    </h3>
                                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-xl shrink-0 flex items-center">
                                        <DollarSign className="w-3.5 h-3.5 -mr-0.5" />
                                        {treatment.price}
                                    </span>
                                </div>

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

                                {/* Acciones de Administración (Editar / Borrar) */}
                                {isAdmin && (
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
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
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

            {/* Modal */}
            {isAdmin && (
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