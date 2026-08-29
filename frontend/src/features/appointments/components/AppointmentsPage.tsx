import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { AppointmentModal } from './AppointmentModal';
import { Button } from '../../../components/ui/Button';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { user, hasRole } = useAuth();
  const isPatient = hasRole('ROLE_PACIENTE');

  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Si es paciente, solo trae sus citas; si es staff/admin, trae todas
      const data = isPatient && user?.username
        ? await appointmentService.getByPatient(user.username)
        : await appointmentService.getAll();
      setAppointments(data);
    } catch (err: any) {
      setError('No se pudieron cargar las citas del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isPatient, user?.username]);

  const handleCreated = (newApp: AppointmentResponseDTO) => {
    setAppointments((prev) => [newApp, ...prev]);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const day = date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
      return { time, day };
    } catch {
      return { time: dateStr, day: '' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Agenda Clínica
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Gestión de Citas
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            Visualiza y coordina las sesiones de rehabilitación de tus pacientes.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-5 h-5" />}
        >
          Agendar Cita
        </Button>
      </div>

      {/* Estado de Carga / Error */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
          <p className="text-sm font-semibold text-slate-600">Cargando agenda...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={fetchAppointments}>
            Reintentar
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No hay citas programadas</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
            Comienza agendando una nueva sesión de valoración o fisioterapia para hoy o días futuros.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Agendar Primera Cita
          </Button>
        </div>
      ) : (
        /* Lista / Timeline de Citas Responsivo */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((app) => {
            const { time, day } = formatDateTime(app.appointmentDate);
            return (
              <div
                key={app.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Fila Superior: Fecha y Estado */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                      <Clock className="w-4 h-4 text-teal-600" />
                      <span>{day}</span>
                      <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded-lg font-mono text-xs font-bold">
                        {time}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {app.status || 'SCHEDULED'}
                    </span>
                  </div>

                  {/* Datos del Paciente */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                      <User className="w-5 h-5 text-slate-400 shrink-0" />
                      <span className="truncate">{app.patientName || app.patientId}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-600 text-xs font-medium">
                      <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                      <span className="truncate">Terapeuta: {app.professionalName || app.professionalId}</span>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium">
                      <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Motivo</span>
                      {app.reason}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear Cita */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
};