import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { appointmentService } from '../services/appointmentService';
import { patientService } from '../../patients/services/patientService';
import { PatientModal } from '../../patients/components/PatientModal';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import type { PatientDTO } from '../../../types/patient';
import { X, Calendar, User, Stethoscope, FileText, AlertCircle, UserPlus } from 'lucide-react';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newAppointment: AppointmentResponseDTO) => void;
    initialDate?: string;
}

export const AppointmentModal = ({ isOpen, onClose, onSuccess, initialDate }: AppointmentModalProps) => {
    const { user, hasRole } = useAuth();
    const isPatient = hasRole('ROLE_PACIENTE');

    const [patientId, setPatientId] = useState(isPatient ? user?.username || '' : '');
    const [professionalId, setProfessionalId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [reason, setReason] = useState('');
    const [appointmentType, setAppointmentType] = useState('VALORACION_INICIAL'); // Por Defecto

    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);
    const [professionalsList, setProfessionalsList] = useState<any[]>([]); // Lista de Doctores
    const [occupiedHours, setOccupiedHours] = useState<string[]>([]); // Estado nuevo: Horas ocupadas
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Efecto nuevo: Si cambias el doctor o el día, le preguntamos al backend qué horas ya se llenaron
    useEffect(() => {
        if (selectedDate && professionalId) {
            appointmentService.getOccupiedHours(professionalId, selectedDate)
                .then(hours => {
                    setOccupiedHours(hours);

                    // UX: Saltar automáticamente a la primera hora libre y futura
                    setSelectedTime(currentTime => {
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const isToday = selectedDate === todayStr;
                        const currentHour = now.getHours();

                        const allHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

                        const isInvalid = (h: string) => {
                            const hNum = parseInt(h.split(':')[0], 10);
                            return hours.includes(h) || (isToday && hNum <= currentHour);
                        };

                        if (isInvalid(currentTime)) {
                            const firstFree = allHours.find(h => !isInvalid(h));
                            return firstFree || '';
                        }
                        return currentTime;
                    });
                })
                .catch(() => setOccupiedHours([]));
        } else {
            setOccupiedHours([]);
        }
    }, [selectedDate, professionalId]);

    // Estado para abrir el modal de registrar paciente
    const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);

    const loadPatients = () => {
        patientService.getAll().then((data) => {
            // Filtramos a los pacientes eliminados o inactivos
            const activePatients = data.filter(p => p.enabled);
            setPatientsList(activePatients);
            if (activePatients.length > 0 && !patientId) {
                setPatientId(activePatients[0].username);
            }
        }).catch(() => { });
    };

    useEffect(() => {
        if (isOpen) {
            // 1. Descargar la lista de Doctores reales de la BD
            appointmentService.getProfessionals().then(data => {
                setProfessionalsList(data);
                // Si eres Fisio, te pones a ti mismo. Si eres paciente, dejamos la cajita vacía para que tú elijas.
                if (hasRole('ROLE_FISIOTERAPEUTA')) {
                    setProfessionalId(user?.username || '');
                } else if (data.length > 0 && !professionalId) {
                    setProfessionalId(''); // Forzamos a que el usuario despliegue la lista y elija
                }
            }).catch(() => { });

            // 2. Limpiar estados residuales y asegurar que la fecha sea hoy o futura
            setErrorMsg(null);
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            // Si la fecha inicial seleccionada es pasada o vacía, arrancar en hoy
            const targetDate = initialDate && initialDate >= todayStr ? initialDate : todayStr;
            setSelectedDate(targetDate);

            // Calcular la primera hora válida más cercana
            const allHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
            const isToday = targetDate === todayStr;
            const currentHour = now.getHours();
            const firstValidTime = allHours.find(h => {
                const hNum = parseInt(h.split(':')[0], 10);
                return !isToday || hNum > currentHour;
            }) || '08:00';

            setSelectedTime(firstValidTime);
            setReason('');
            setAppointmentType('VALORACION_INICIAL');

            // 3. Cargar lista de pacientes (si eres doctor) o fijar tu nombre (si eres paciente)
            if (isPatient) {
                setPatientId(user?.username || '');
            } else {
                loadPatients();
            }
        }
    }, [isOpen, isPatient, user?.username]);

    if (!isOpen) return null;

    const handleClose = () => {
        setErrorMsg(null);
        setSelectedDate('');      // Limpiamos la fecha nueva
        setSelectedTime('09:00'); // Reiniciamos la hora
        setReason('');
        onClose();
    };

    const handlePatientCreated = (newPatient: PatientDTO) => {
        setPatientsList((prev) => [newPatient, ...prev]);
        setPatientId(newPatient.username);
        setIsNewPatientModalOpen(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const finalDateTime = `${selectedDate}T${selectedTime}`;
            const created = await appointmentService.create({
                patientId,
                professionalId,
                appointmentDate: finalDateTime,
                reason,
                appointmentType, // Enviamos el combobox
            });
            onSuccess(created);
            handleClose();
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al agendar la cita. Verifica que la fecha sea futura y sin solapamientos.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Agendar Nueva Cita</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Completa los datos de la sesión clínica de 60 min</p>
                        </div>
                        <button
                            onClick={handleClose}
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
                        {/* Selector de Paciente con Botón de Alta Rápida */}
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
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-800">
                                        Seleccionar Paciente <span className="text-rose-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewPatientModalOpen(true)}
                                        className="text-xs font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        + Registrar Nuevo
                                    </button>
                                </div>

                                {patientsList.length > 0 ? (
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
                                ) : (
                                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-amber-900">
                                            Sin pacientes registrados aún.
                                        </span>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            type="button"
                                            onClick={() => setIsNewPatientModalOpen(true)}
                                            leftIcon={<UserPlus className="w-4 h-4" />}
                                        >
                                            + Registrar Paciente
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Fisioterapeuta Asignado <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative rounded-xl">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Stethoscope className="w-5 h-5" />
                                </div>
                                <select
                                    required
                                    value={professionalId}
                                    onChange={(e) => setProfessionalId(e.target.value)}
                                    disabled={hasRole('ROLE_FISIOTERAPEUTA')} // Un doctor no puede agendar a nombre de otro colega
                                    className="w-full h-12 bg-white text-slate-900 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 transition-all duration-200 cursor-pointer disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled>-- Elige un Fisioterapeuta --</option>
                                    {professionalsList.map((doc) => (
                                        <option key={doc.id} value={doc.username}>
                                            Dr/a. {doc.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Fecha de la Sesión"
                                type="date"
                                required
                                min={(() => {
                                    const n = new Date();
                                    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
                                })()}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                leftIcon={<Calendar className="w-5 h-5" />}
                            />
                            <div>
                                <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                    Hora de Inicio <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full h-12 bg-white text-slate-900 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 pl-4 pr-4 transition-all cursor-pointer"
                                >
                                    {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map(time => {
                                        const now = new Date();
                                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                                        const isToday = selectedDate === todayStr;
                                        const timeHour = parseInt(time.split(':')[0], 10);
                                        const isPast = isToday && timeHour <= now.getHours();
                                        const isOccupied = occupiedHours.includes(time);
                                        const isDisabled = isOccupied || isPast;

                                        let labelSuffix = '';
                                        if (isOccupied) labelSuffix = '(Ocupado)';
                                        else if (isPast) labelSuffix = '(Pasada)';

                                        return (
                                            <option
                                                key={time}
                                                value={time}
                                                disabled={isDisabled}
                                                className={isDisabled ? "text-slate-400 bg-slate-100" : ""}
                                            >
                                                {time} {labelSuffix}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Tipo de Cita <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative rounded-xl mb-4">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <select
                                    required
                                    value={appointmentType}
                                    onChange={(e) => setAppointmentType(e.target.value)}
                                    className="w-full h-12 bg-white text-slate-900 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 transition-all duration-200 cursor-pointer"
                                >
                                    <option value="VALORACION_INICIAL">Valoración Inicial</option>
                                    <option value="REHABILITACION">Plan de Rehabilitación (Seguimiento)</option>
                                    <option value="REVISION_RUTINA">Revisión de Rutina</option>
                                </select>
                            </div>

                            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                                Notas u Observaciones Adicionales <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Detalles sobre el motivo de la cita, dolores, etc."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 py-3 transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" size="md" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                isLoading={isLoading}
                                disabled={!isPatient && !patientId}
                            >
                                Confirmar Cita
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Modal anidado para registrar paciente al instante */}
            <PatientModal
                isOpen={isNewPatientModalOpen}
                onClose={() => setIsNewPatientModalOpen(false)}
                onSuccess={handlePatientCreated}
            />
        </>
    );
};