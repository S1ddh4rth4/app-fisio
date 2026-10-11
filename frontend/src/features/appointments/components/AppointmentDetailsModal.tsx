import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { appointmentService } from '../services/appointmentService';
import { paymentService } from '../services/paymentService';
import { treatmentService } from '../../treatments/services/treatmentService';
import { TreatmentModal } from '../../treatments/components/TreatmentModal';
import { ClinicalHistoryViewer } from '../../records/components/ClinicalHistoryViewer';
import { PrescriptionModal } from '../../prescriptions/components/PrescriptionModal';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import type { TreatmentResponseDTO } from '../../../types/treatment';
import type { PatientPackageResponseDTO } from '../../../types/payment';
import { X, FileText, DollarSign, CalendarDays, CheckCircle2, User, Activity, AlertCircle, Package, Dumbbell } from 'lucide-react';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: AppointmentResponseDTO | null;
    onUpdate: (updatedAppointment: AppointmentResponseDTO) => void;
}

export const AppointmentDetailsModal = ({ isOpen, onClose, appointment, onUpdate }: AppointmentDetailsModalProps) => {
    const [activeTab, setActiveTab] = useState<'RESUMEN' | 'EVOLUCION' | 'CAJA'>('RESUMEN');

    // Estados para Notas y Adendas
    const [notes, setNotes] = useState('');
    const [isAddingAddendum, setIsAddingAddendum] = useState(false);
    const [addendumText, setAddendumText] = useState('');

    // Estados para Caja
    const [treatmentsList, setTreatmentsList] = useState<TreatmentResponseDTO[]>([]);
    const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
    const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
    const [patientPackages, setPatientPackages] = useState<PatientPackageResponseDTO[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [billingMode, setBillingMode] = useState<'INDIVIDUAL' | 'PAQUETE'>('INDIVIDUAL');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

    // Cargar datos al abrir
    useEffect(() => {
        if (isOpen && appointment) {
            setNotes(appointment.clinicalNotes || '');
            setActiveTab('RESUMEN');
            setError(null);
            // 1. Limpiar paquetes anteriores inmediatamente para no mezclar pacientes
            setPatientPackages([]);
            setSelectedPackageId('');
            setBillingMode('INDIVIDUAL');

            // Cargar catálogo de tratamientos para la caja
            treatmentService.getAll().then(data => {
                setTreatmentsList(data);
            }).catch(() => { });

            // 2. Cargar únicamente los paquetes del paciente de esta cita
            const targetPatient = appointment.patientName || appointment.patientId;
            if (targetPatient) {
                paymentService.getPatientPackages(targetPatient).then(pkgs => {
                    // Filtrar estrictamente que el paquete pertenezca a este paciente exacto
                    const currentPatientName = (appointment.patientName || '').toLowerCase().trim();
                    const currentPatientId = (appointment.patientId || '').toLowerCase().trim();

                    const actives = pkgs.filter(p => {
                        const pkgPatientName = (p.patientUsername || '').toLowerCase().trim();
                        const pkgPatientId = (p.patientId || '').toLowerCase().trim();
                        const isSamePatient = (pkgPatientName && pkgPatientName === currentPatientName) ||
                            (pkgPatientId && (pkgPatientId === currentPatientId || pkgPatientId === currentPatientName));
                        return p.status === 'ACTIVO' && p.remainingSessions > 0 && isSamePatient;
                    });
                    setPatientPackages(actives);
                    if (actives.length > 0) {
                        setSelectedPackageId(actives[0].id);
                        setBillingMode('PAQUETE'); // Si este paciente tiene saldo propio, sugerirlo
                    } else {
                        setBillingMode('INDIVIDUAL');
                    }
                }).catch(() => {
                    setPatientPackages([]);
                    setBillingMode('INDIVIDUAL');
                });
            }
        } else {
            setPatientPackages([]);
        }
    }, [isOpen, appointment?.id, appointment?.patientId, appointment?.patientName]);

    if (!isOpen || !appointment) return null;

    const handleSaveNotes = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const updated = await appointmentService.updateNotes(appointment.id, notes);
            onUpdate(updated);

            // UX Mejorada: Si la cita no ha sido pagada, empujarlo a la Caja.
            if (appointment.paymentStatus !== 'PAGADO') {
                setActiveTab('CAJA');
            } else {
                setActiveTab('RESUMEN');
            }
        } catch (err: any) {
            setError('Error al guardar la nota clínica.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAddendum = async () => {
        if (!addendumText.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const timestamp = new Date().toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            const updatedNotes = notes
                ? `${notes}\n\n---\n[ACLARACIÓN / ADENDA - ${timestamp}]:\n${addendumText.trim()}`
                : `[ACLARACIÓN / ADENDA - ${timestamp}]:\n${addendumText.trim()}`;

            const updated = await appointmentService.updateNotes(appointment.id, updatedNotes);
            setNotes(updatedNotes);
            onUpdate(updated);
            setAddendumText('');
            setIsAddingAddendum(false);
        } catch (err: any) {
            setError('Error al registrar la aclaración médica.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessPayment = async () => {
        if (!selectedTreatmentId) {
            setError('Debes seleccionar un tratamiento para cobrar.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const updated = await appointmentService.processPayment(appointment.id, selectedTreatmentId, paymentMethod);
            onUpdate(updated);
            setActiveTab('RESUMEN'); // Volver al resumen tras cobrar
        } catch (err: any) {
            setError('Error al procesar el pago.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayWithPackage = async () => {
        // Candado si ya está en proceso o ya fue pagada
        if (isLoading || appointment.paymentStatus === 'PAGADO') return;

        if (!selectedPackageId) {
            setError('Debes seleccionar un paquete con sesiones disponibles.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const updated = await paymentService.updateAppointmentPayment(appointment.id, {
                paymentStatus: 'PAQUETE',
                paymentMethod: 'PAQUETE',
                amount: 0,
                patientPackageId: selectedPackageId,
            });
            onUpdate(updated);
            // Actualizar la cita local y pasar a la pestaña resumen para que la caja quede sellada
            appointment.paymentStatus = 'PAGADO';
            setActiveTab('RESUMEN');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al descontar sesión del paquete.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper para formato de fecha
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header Dinámico */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${appointment.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${appointment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {appointment.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Expediente de Sesión</h2>
                            <p className="text-sm font-medium text-slate-500 capitalize">{appointment.status === 'COMPLETED' ? 'Sesión Finalizada y Cobrada' : 'Sesión Pendiente'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navegación de Pestañas */}
                <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/50">
                    <button onClick={() => setActiveTab('RESUMEN')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'RESUMEN' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <CalendarDays className="w-4 h-4" /> Resumen
                    </button>
                    <button onClick={() => setActiveTab('EVOLUCION')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'EVOLUCION' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <FileText className="w-4 h-4" /> Evolución
                    </button>
                    <button onClick={() => setActiveTab('CAJA')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'CAJA' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                        <DollarSign className="w-4 h-4" /> Caja y Cobro
                    </button>
                </div>

                {/* Contenedor Principal */}
                <div className="p-6 bg-white min-h-[350px]">
                    {error && (
                        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-sm text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> {error}
                        </div>
                    )}

                    {/* PESTAÑA 1: RESUMEN */}
                    {activeTab === 'RESUMEN' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1 text-slate-500"><User className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Paciente</span></div>
                                    <p className="font-semibold text-slate-900 text-lg">{appointment.patientName}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1 text-slate-500"><Activity className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Fisioterapeuta</span></div>
                                    <p className="font-semibold text-slate-900 text-lg">{appointment.professionalName}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-indigo-900 capitalize mb-1">{formatDate(appointment.appointmentDate)}</p>
                                    <p className="text-sm text-indigo-700"><strong>Tipo:</strong> {appointment.appointmentType?.replace('_', ' ')}</p>
                                    <p className="text-sm text-indigo-700"><strong>Motivo:</strong> {appointment.reason}</p>
                                    {appointment.treatmentName && <p className="text-sm text-emerald-700 mt-1 font-bold">Cobrado: {appointment.treatmentName}</p>}
                                </div>

                                {/* Botón Todo en Uno: Consultar o Llenar Historia Clínica sin salir de la cita */}
                                <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between">
                                    <span className="text-xs text-indigo-800 font-semibold">Expediente Clínico del Paciente:</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-white text-teal-700 border-teal-300 hover:bg-teal-50"
                                        onClick={() => setIsHistoryOpen(true)}
                                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                                    >
                                        Abrir Historia Clínica
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PESTAÑA 2: EVOLUCIÓN */}
                    {activeTab === 'EVOLUCION' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full">
                            <div className="flex items-center justify-between pb-1">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900">Notas Clínicas de la Sesión</label>
                                    <p className="text-xs text-slate-500">Registra el avance de la sesión actual o consulta su expediente completo.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {appointment.status === 'COMPLETED' && (
                                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                            Expediente Sellado
                                        </span>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                        onClick={() => setIsPrescriptionModalOpen(true)}
                                        leftIcon={<Dumbbell className="w-3.5 h-3.5 text-indigo-600" />}
                                    >
                                        + Prescribir Ejercicios
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-100"
                                        onClick={() => setIsHistoryOpen(true)}
                                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                                    >
                                        Historia Clínica Completa
                                    </Button>
                                </div>
                            </div>

                            {appointment.status === 'COMPLETED' ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[140px] text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                                        {notes || <span className="text-slate-400 italic font-sans">Sin notas clínicas registradas en esta sesión.</span>}
                                    </div>

                                    {/* Sección de Adenda / Aclaración */}
                                    {isAddingAddendum ? (
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in duration-200">
                                            <label className="block text-xs font-bold text-indigo-900 uppercase">
                                                Nueva Aclaración Médica (Adenda)
                                            </label>
                                            <textarea
                                                value={addendumText}
                                                onChange={(e) => setAddendumText(e.target.value)}
                                                placeholder="Escribe aquí los detalles complementarios o aclaraciones de la consulta..."
                                                className="w-full min-h-[90px] p-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 outline-none resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setIsAddingAddendum(false);
                                                        setAddendumText('');
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={handleSaveAddendum}
                                                    isLoading={isLoading}
                                                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                                                >
                                                    Guardar Aclaración
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIsAddingAddendum(true)}
                                                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                            >
                                                + Agregar Nota Aclaratoria (Adenda)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Describe la evolución del paciente, ejercicios realizados, dolor manifestado..."
                                        className="w-full flex-1 min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-slate-700"
                                    />
                                    <div className="flex items-center justify-between pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setIsHistoryOpen(true)}
                                            className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline flex items-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Reevaluar en Historia Clínica (7 páginas, mapa y dolor)
                                        </button>
                                        <Button variant="primary" onClick={handleSaveNotes} isLoading={isLoading} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                                            Guardar Nota Clínica
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* PESTAÑA 3: CAJA */}
                    {activeTab === 'CAJA' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            {appointment.paymentStatus === 'PAGADO' ? (
                                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-3xl text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-800 mb-1">¡Esta sesión ya está pagada!</h3>
                                    <p className="text-emerald-600 font-medium">Tratamiento: {appointment.treatmentName}</p>
                                    <p className="text-emerald-600 font-medium">Método: {appointment.paymentMethod}</p>
                                    <p className="text-emerald-700 font-extrabold mt-2 text-2xl">${appointment.paymentAmount} MXN</p>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl mb-4">
                                        <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Pendiente de Cobro</p>
                                    </div>
                                    {/* Selector: ¿Descontar de paquete o cobro regular? */}
                                    {patientPackages.length > 0 && (
                                        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-teal-900 uppercase">Paquete Activo Detectado</p>
                                                    <p className="text-xs text-teal-700">El paciente cuenta con saldo de sesiones disponibles.</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setBillingMode('PAQUETE')}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${billingMode === 'PAQUETE' ? 'bg-teal-700 text-white' : 'bg-white text-teal-800 border border-teal-200'}`}
                                                >
                                                    Usar Paquete
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setBillingMode('INDIVIDUAL')}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${billingMode === 'INDIVIDUAL' ? 'bg-slate-700 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                                                >
                                                    Cobro Normal
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {billingMode === 'PAQUETE' && patientPackages.length > 0 ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Selecciona el Paquete a Descontar *</label>
                                                <select
                                                    value={selectedPackageId}
                                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                                                >
                                                    {patientPackages.map(pkg => (
                                                        <option key={pkg.id} value={pkg.id}>
                                                            {pkg.packageName} — Le quedan {pkg.remainingSessions} de {pkg.totalSessions} sesiones
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                                                <span className="text-slate-600 font-medium">Costo para el paciente hoy:</span>
                                                <span className="font-extrabold text-teal-700 text-base">$0.00 MXN (Pre-pagado)</span>
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <Button variant="primary" onClick={handlePayWithPackage} isLoading={isLoading} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                                                    Descontar 1 Sesión y Completar Cita
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-sm font-bold text-slate-700">Tratamiento Realizado *</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTreatmentModalOpen(true)}
                                                        className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer"
                                                    >
                                                        + Crear nuevo tratamiento
                                                    </button>
                                                </div>
                                                <select
                                                    value={selectedTreatmentId}
                                                    onChange={(e) => setSelectedTreatmentId(e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                                >
                                                    <option value="" disabled>-- Selecciona un Tratamiento --</option>
                                                    {treatmentsList.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} - ${t.price}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Método de Pago *</label>
                                                <select
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                                >
                                                    <option value="EFECTIVO">Efectivo</option>
                                                    <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                                                    <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                                                    <option value="TRANSFERENCIA">Transferencia</option>
                                                </select>
                                            </div>
                                            <div className="pt-2 flex justify-end">
                                                <Button variant="primary" onClick={handleProcessPayment} isLoading={isLoading} leftIcon={<DollarSign className="w-4 h-4" />}>Procesar Cobro</Button>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para crear un nuevo tratamiento en el momento */}
            <TreatmentModal
                isOpen={isTreatmentModalOpen}
                onClose={() => setIsTreatmentModalOpen(false)}
                onSuccess={(newTreatment) => {
                    setTreatmentsList((prev) => [newTreatment, ...prev]);
                    setSelectedTreatmentId(newTreatment.id);
                    setIsTreatmentModalOpen(false);
                }}
            />

            {/* Modal Visor/Editor de Historia Clínica desde la Cita */}
            {isHistoryOpen && appointment && (
                <ClinicalHistoryViewer
                    patientId={appointment.patientName || appointment.patientId}
                    patientUsername={appointment.patientName || appointment.patientId}
                    onClose={() => setIsHistoryOpen(false)}
                />
            )}

            {/* Modal para Crear Prescripción de Ejercicios desde la Sesión */}
            {isPrescriptionModalOpen && (
                <PrescriptionModal
                    isOpen={isPrescriptionModalOpen}
                    onClose={() => setIsPrescriptionModalOpen(false)}
                    onSuccess={() => {
                        setIsPrescriptionModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};