import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { medicalRecordService } from '../services/medicalRecordService';
import { clinicalHistoryService } from '../services/clinicalHistoryService';
import { patientService } from '../../patients/services/patientService';
import { MedicalRecordModal } from './MedicalRecordModal';
import { Button } from '../../../components/ui/Button';
import type { MedicalRecordResponseDTO } from '../../../types/medicalRecord';
import type { ClinicalHistoryResponseDTO } from '../../../types/clinicalHistory';
import type { PatientDTO } from '../../../types/patient';
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
import { ClinicalHistoryViewer } from './ClinicalHistoryViewer';

export const RecordsPage = () => {
    const { user, hasRole } = useAuth();
    const isPatient = hasRole('ROLE_PACIENTE');
    const [searchParams] = useSearchParams();
    const initialPatient = searchParams.get('patient') || '';
    const [patientIdInput, setPatientIdInput] = useState(initialPatient);
    const [searchedPatient, setSearchedPatient] = useState<string | null>(null);
    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);

    const [records, setRecords] = useState<MedicalRecordResponseDTO[]>([]);
    const [clinicalHistories, setClinicalHistories] = useState<ClinicalHistoryResponseDTO[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<ClinicalHistoryResponseDTO | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Cargar lista de pacientes solo si es personal clínico
    useEffect(() => {
        if (!isPatient) {
            patientService.getAll().then(data => {
                setPatientsList(data.filter(p => p.enabled));
            }).catch(() => { });
        }
    }, [isPatient]);

    const handleSearch = async (targetId: string = patientIdInput) => {
        if (!targetId.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            // Consultamos tanto notas de evolución como la historia clínica completa de 7 páginas
            const [medData, histData] = await Promise.all([
                medicalRecordService.getByPatient(targetId.trim()).catch(() => []),
                clinicalHistoryService.getByPatient(targetId.trim()).catch(() => []),
            ]);
            setRecords(medData);
            setClinicalHistories(histData);
            setSearchedPatient(targetId.trim());
        } catch (err: any) {
            setError(`No se pudo consultar el expediente del paciente "${targetId}".`);
            setRecords([]);
            setClinicalHistories([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Si es paciente, auto-consultar su propio expediente inmediatamente
    useEffect(() => {
        if (isPatient && user?.username) {
            setPatientIdInput(user.username);
            handleSearch(user.username);
        } else if (initialPatient) {
            handleSearch(initialPatient);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPatient, user?.username]);

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
                        {isPatient ? 'Mi Salud' : 'Historia Clínica'}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        {isPatient ? 'Mi Expediente Clínico' : 'Expedientes & Notas Clínicas'}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        {isPatient
                            ? 'Consulta tus diagnósticos, valoraciones y descarga tu historia médica en PDF.'
                            : 'Consulta diagnósticos, evoluciones y tratamientos de cada paciente.'}
                    </p>
                </div>

                {!isPatient && (
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsModalOpen(true)}
                            leftIcon={<Plus className="w-5 h-5" />}
                        >
                            Nueva Nota de Evolución
                        </Button>
                    </div>
                )}
            </div>

            {/* Buscador de Paciente (Solo visible para Personal Clínico) */}
            {!isPatient && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                    <label className="block text-sm font-bold text-slate-800 mb-2">
                        Buscar Expediente por Paciente
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <select
                                value={patientIdInput}
                                onChange={(e) => {
                                    setPatientIdInput(e.target.value);
                                    // Opcional: auto-buscar al seleccionar
                                    // handleSearch(e.target.value); 
                                }}
                                className="w-full h-12 pl-11 pr-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="" disabled>-- Selecciona un Paciente de tu lista --</option>
                                {patientsList.map(p => (
                                    <option key={p.id} value={p.username}>{p.username} ({p.email})</option>
                                ))}
                            </select>
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
                </div>
            )}

            {/* Mensajes de Estado: Loading y Error */}
            {isLoading && (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cargando expediente clínico...</p>
                </div>
            )}

            {error && !isLoading && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-rose-200 dark:border-rose-900/50 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                </div>
            )}

            {/* SECCIÓN 1: Tarjeta Destacada de Historia Clínica Completa */}
            {searchedPatient && !isLoading && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-lg">Historia Clínica Completa</h3>
                                <p className="text-xs text-slate-500">Evaluación funcional, goniometría, CIF/CIE-10 y consentimiento legal.</p>

                            </div>
                        </div>

                        {clinicalHistories.length === 0 && !isPatient && (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => {
                                    setSelectedHistory(null);
                                    setIsHistoryOpen(true);
                                }}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                + Realizar Valoración Inicial
                            </Button>
                        )}
                        {clinicalHistories.length === 0 && isPatient && (
                            <span className="text-xs text-slate-400 italic">Pendiente de evaluación inicial por tu fisioterapeuta.</span>
                        )}
                    </div>

                    {/* Línea de tiempo de Evaluaciones y Reevaluaciones */}
                    {clinicalHistories.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Registros en Expediente ({clinicalHistories.length}):
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {clinicalHistories.map((hist, idx) => (
                                    <div
                                        key={hist.id || idx}
                                        className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3 hover:border-teal-400 hover:shadow-md transition"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${hist.evaluationType === 'VALORACION_INICIAL'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-emerald-100 text-emerald-800'
                                                    }`}>
                                                    {hist.evaluationType === 'VALORACION_INICIAL' ? 'Valoración Inicial' : 'Reevaluación de Progreso'}
                                                </span>
                                                <span className="text-xs text-slate-900 font-bold font-mono">
                                                    {formatDate(hist.createdAt)}
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-slate-900 text-sm">
                                                {hist.mainDiagnosis || 'Fisioterapia General'}
                                            </h4>
                                            <p className="text-xs text-slate-800 font-medium mt-1">
                                                Dolor EVA: <strong className="text-rose-600 font-black text-sm">{hist.painLevel ?? 0}/10</strong> • Por: <span className="text-slate-900 font-bold">{hist.physiotherapistName || 'Fisioterapeuta'}</span>
                                            </p>
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full text-xs justify-center"
                                            onClick={() => {
                                                setSelectedHistory(hist);
                                                setIsHistoryOpen(true);
                                            }}
                                            leftIcon={<FileText className="w-3.5 h-3.5" />}
                                        >
                                            {isPatient ? 'Ver / Imprimir' : 'Consultar / Abrir'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SECCIÓN 2: Lista de Notas Diarias de Evolución */}
            {searchedPatient && !isLoading && (
                records.length === 0 ? (
                    <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 text-center flex flex-col items-center justify-center">
                        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-3 border border-teal-100">
                            <FileText className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                            Sin notas de evolución para "{searchedPatient}"
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">
                            Aún no se han registrado notas diarias subsecuentes para este paciente.
                        </p>
                        {!isPatient && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsModalOpen(true)}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Registrar Primera Nota de Evolución
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-600" />
                                Historial de Notas: <span className="text-teal-700 font-mono">{searchedPatient}</span>
                            </h2>
                            <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                                {records.length} notas registradas
                            </span>
                        </div>

                        <div className="space-y-4">
                            {records.map((rec) => (
                                <div
                                    key={rec.id}
                                    className="bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-teal-300 shadow-xs transition duration-200 space-y-4"
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

                                    <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {rec.notes}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium pt-1">
                                        <Stethoscope className="w-4 h-4 text-teal-600" />
                                        <span>
                                            Atendido por:{' '}
                                            <strong className="text-slate-900">
                                                {rec.physiotherapistName || rec.physiotherapistId || 'Fisioterapeuta'}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}

            {/* Modal */}
            <MedicalRecordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreated}
                defaultPatientId={patientIdInput}
            />

            {/* Visor / Editor de Historia Clínica */}
            {isHistoryOpen && (
                <ClinicalHistoryViewer
                    patientId={searchedPatient || patientIdInput}
                    patientUsername={searchedPatient || patientIdInput}
                    initialHistory={selectedHistory || undefined}
                    onSaved={() => handleSearch(searchedPatient || patientIdInput)}
                    onClose={() => {
                        setIsHistoryOpen(false);
                        setSelectedHistory(null);
                    }}
                />
            )}
        </div>
    );
};