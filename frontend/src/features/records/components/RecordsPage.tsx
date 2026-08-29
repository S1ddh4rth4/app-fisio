import { useState } from 'react';
import { medicalRecordService } from '../services/medicalRecordService';
import { MedicalRecordModal } from './MedicalRecordModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { MedicalRecordResponseDTO } from '../../../types/medicalRecord';
import {
    FileText,
    Plus,
    Search,
    User,
    Stethoscope,
    Calendar,
    AlertCircle,
    Loader2
} from 'lucide-react';

export const RecordsPage = () => {
    const [patientIdInput, setPatientIdInput] = useState('paciente1');
    const [searchedPatient, setSearchedPatient] = useState<string | null>(null);
    const [records, setRecords] = useState<MedicalRecordResponseDTO[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (targetId: string = patientIdInput) => {
        if (!targetId.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await medicalRecordService.getByPatient(targetId.trim());
            setRecords(data);
            setSearchedPatient(targetId.trim());
        } catch (err: any) {
            setError(`No se pudo consultar el expediente del paciente "${targetId}".`);
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreated = (newRecord: MedicalRecordResponseDTO) => {
        setRecords((prev) => [newRecord, ...prev]);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                        Historia Clínica
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        Expedientes & Notas Clínicas
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        Consulta diagnósticos, evoluciones y tratamientos de cada paciente.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<Plus className="w-5 h-5" />}
                >
                    Nueva Nota Clínica
                </Button>
            </div>

            {/* Buscador de Paciente */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                    Buscar Expediente por Paciente
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <Input
                            placeholder="Escribe el ID del paciente (ej. paciente1, paciente2, paciente3)"
                            value={patientIdInput}
                            onChange={(e) => setPatientIdInput(e.target.value)}
                            leftIcon={<Search className="w-5 h-5" />}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => handleSearch()}
                        isLoading={isLoading}
                        leftIcon={<Search className="w-5 h-5" />}
                    >
                        Consultar Expediente
                    </Button>
                </div>

                {/* Accesos rápidos a pacientes de prueba */}
                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500">
                    <span>Prueba rápida:</span>
                    {['paciente1', 'paciente2', 'paciente3'].map((id) => (
                        <button
                            key={id}
                            onClick={() => {
                                setPatientIdInput(id);
                                handleSearch(id);
                            }}
                            className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 px-2.5 py-1 rounded-lg transition border border-slate-200 cursor-pointer font-mono"
                        >
                            {id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido de Expedientes */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Cargando expediente clínico...</p>
                </div>
            ) : error ? (
                <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">{error}</p>
                </div>
            ) : searchedPatient && records.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Sin notas clínicas para "{searchedPatient}"
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                        Aún no se ha registrado ninguna nota de evolución para este paciente.
                    </p>
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsModalOpen(true)}
                        leftIcon={<Plus className="w-5 h-5" />}
                    >
                        Registrar Primera Nota
                    </Button>
                </div>
            ) : records.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-600" />
                            Historial de: <span className="text-teal-700 font-mono">{searchedPatient}</span>
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                            {records.length} notas registradas
                        </span>
                    </div>

                    <div className="space-y-4">
                        {records.map((rec) => (
                            <div
                                key={rec.id}
                                className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs transition duration-200 space-y-4"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-900 text-base">
                                            {rec.diagnosis}
                                        </span>
                                        {rec.appointmentId && (
                                            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                                Cita #{rec.appointmentId}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{formatDate(rec.createdAt)}</span>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    {rec.notes}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
                                    <Stethoscope className="w-4 h-4 text-teal-600" />
                                    <span>
                                        Atendido por:{' '}
                                        <strong className="text-slate-800">
                                            {rec.physiotherapistName || rec.physiotherapistId || 'Fisioterapeuta'}
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Modal */}
            <MedicalRecordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreated}
                defaultPatientId={patientIdInput}
            />
        </div>
    );
};