import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { paymentService } from '../services/paymentService';
import { AppointmentModal } from './AppointmentModal';
import { AppointmentDetailsModal } from './AppointmentDetailsModal';
import { BuyPackageModal } from './BuyPackageModal';
import { Button } from '../../../components/ui/Button';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import type { PatientPackageResponseDTO } from '../../../types/payment';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Stethoscope,
  Package,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CalendarDays
} from 'lucide-react';

export const AppointmentsPage = () => {
  const { user, hasRole } = useAuth();
  const isPatient = hasRole('ROLE_PACIENTE');
  const isStaffOrAdmin = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA') || hasRole('ROLE_RECEPCIONISTA');

  const [appointments, setAppointments] = useState<AppointmentResponseDTO[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackageResponseDTO[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuyPkgModalOpen, setIsBuyPkgModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentResponseDTO | null>(null);

  // Función para obtener la fecha local exacta (evitando el desfase de zona horaria UTC)
  const getLocalDateStr = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Estados de Vista y Navegación del Calendario
  const [viewMode, setViewMode] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getLocalDateStr());

  const fetchAppointmentsAndPackages = async () => {
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);

      if (isPatient && user?.username) {
        try {
          const pkgs = await paymentService.getPatientPackages(user.username);
          setPatientPackages(pkgs.filter((p) => p.status === 'ACTIVO'));
        } catch { }
      }
    } catch {
      // Manejo silencioso o notificacion al usuario
    }
  };

  useEffect(() => {
    fetchAppointmentsAndPackages();
  }, [user?.username]);

  const handleCreated = (newApp: AppointmentResponseDTO) => {
    setAppointments((prev) => [newApp, ...prev]);
    if (isStaffOrAdmin) {
      setSelectedAppointment(newApp);
    }
  };

  const handlePaymentSuccess = (updated: AppointmentResponseDTO) => {
    setAppointments((prev) =>
      prev.map((app) => (app.id === updated.id ? updated : app))
    );
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getAppointmentsForDate = (dateString: string) => {
    return appointments.filter((app) => {
      const appDateOnly = app.appointmentDate.split('T')[0];
      return appDateOnly === dateString;
    });
  };

  // Cálculos de días y semanas del mes
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: Dom a 6: Sab
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedDayAppointments = getAppointmentsForDate(selectedDateStr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            Agenda Clínica Visual
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 capitalize">
            {isPatient ? 'Mis Sesiones de Terapia' : 'Agenda de Consultas'}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            {isPatient
              ? 'Consulta tus sesiones agendadas y horarios de rehabilitación.'
              : 'Gestión individual de horarios de 60 minutos por terapeuta.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Conmutador de Vistas */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'CALENDAR'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Calendario</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${viewMode === 'LIST'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Tarjetas</span>
            </button>
          </div>

          {isStaffOrAdmin && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsBuyPkgModalOpen(true)}
              leftIcon={<Package className="w-5 h-5 text-indigo-600" />}
            >
              Vender Paquete
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            disabled={selectedDateStr < getLocalDateStr()}
            title={selectedDateStr < getLocalDateStr() ? "No es posible agendar citas en fechas pasadas" : "Agendar cita"}
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-5 h-5" />}
            className={selectedDateStr < getLocalDateStr() ? "!opacity-40 !cursor-not-allowed !grayscale" : ""}
          >
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* Banner de Paquetes Activos para Pacientes */}
      {isPatient && patientPackages.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-teal-600 p-6 rounded-3xl text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider">Mis Paquetes y Saldo de Sesiones</h2>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">Activo</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patientPackages.map((pkg) => (
              <div key={pkg.id} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <h3 className="font-bold text-sm text-white truncate">{pkg.packageName}</h3>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-2xl font-black text-white">{pkg.remainingSessions}</span>
                  <span className="text-xs text-indigo-100">de {pkg.totalSessions} disponibles</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 1: CALENDARIO INTERACTIVO */}
      {viewMode === 'CALENDAR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cuadrícula Mensual */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
                {monthName}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-600"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-100 rounded-xl transition cursor-pointer text-slate-600"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase tracking-wider py-1">
              <span>Dom</span>
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-2xl bg-slate-50/50" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = String(dayNum).padStart(2, '0');
                const formattedMonth = String(month + 1).padStart(2, '0');
                const cellDateStr = `${year}-${formattedMonth}-${formattedDay}`;

                const dayApps = getAppointmentsForDate(cellDateStr);
                const isSelected = selectedDateStr === cellDateStr;
                const isToday = getLocalDateStr() === cellDateStr;

                return (
                  <button
                    key={cellDateStr}
                    onClick={() => setSelectedDateStr(cellDateStr)}
                    className={`h-14 sm:h-20 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${isSelected
                      ? 'border-teal-500 bg-teal-50/60 shadow-xs ring-2 ring-teal-500/20'
                      : isToday
                        ? 'border-slate-300 bg-amber-50/30'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isSelected
                          ? 'bg-teal-600 text-white'
                          : isToday
                            ? 'bg-amber-500 text-white'
                            : 'text-slate-800'
                          }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {dayApps.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <span className="text-[10px] font-extrabold bg-teal-600 text-white px-1.5 py-0.2 rounded-md truncate max-w-full">
                          {dayApps.length} {dayApps.length === 1 ? 'cita' : 'citas'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle de Sesiones del Día Seleccionado */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Sesiones del Día
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedDateStr}
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
                  {selectedDayAppointments.length} programadas
                </span>
              </div>

              {selectedDayAppointments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No hay citas en este día.</p>
                  {selectedDateStr >= getLocalDateStr() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                      className="mt-2"
                    >
                      + Agendar Cita
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 mt-4 max-h-[460px] overflow-y-auto pr-1">
                  {selectedDayAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 bg-slate-50 hover:bg-teal-50/40 rounded-2xl border border-slate-200/80 transition space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-teal-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimeOnly(app.appointmentDate)} (60 min)
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {app.paymentStatus || 'PENDIENTE'}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>{app.patientName || app.patientId}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>Terapeuta: {app.professionalName || app.professionalId}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {app.reason}
                        </p>
                      </div>

                      {isStaffOrAdmin && (
                        <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            onClick={() => setSelectedAppointment(app)}
                            className="text-xs font-bold text-teal-700 hover:text-teal-900 cursor-pointer"
                          >
                            Abrir Expediente →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: MODO TARJETAS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-800">
                  {app.appointmentDate.replace('T', ' ')} (60 min)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {app.status}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">{app.patientName}</div>
              <p className="text-xs text-slate-600">{app.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
        initialDate={(() => {
          const today = getLocalDateStr();
          return selectedDateStr >= today ? selectedDateStr : today;
        })()}
      />

      <AppointmentDetailsModal
        isOpen={Boolean(selectedAppointment)}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={handlePaymentSuccess}
      />

      <BuyPackageModal
        isOpen={isBuyPkgModalOpen}
        onClose={() => setIsBuyPkgModalOpen(false)}
        onSuccess={() => {
          fetchAppointmentsAndPackages();
        }}
      />
    </div>
  );
};