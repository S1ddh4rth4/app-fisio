import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './features/auth/components/LoginForm';
import { AppLayout } from './components/layout/AppLayout';
import { AppointmentsPage } from './features/appointments/components/AppointmentsPage';
import { RecordsPage } from './features/records/components/RecordsPage';
import { PatientsPage } from './features/patients/components/PatientsPage';
import { TreatmentsPage } from './features/treatments/components/TreatmentsPage';
import { dashboardService } from './features/dashboard/services/dashboardService';
import type { DashboardSummaryDTO } from './types/dashboard';
import {
  Calendar,
  Users,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { ProfilePage } from './features/profile/components/ProfilePage';
import { RoleProtectedRoute } from './routes/RoleProtectedRoute';

// Vista de Inicio / Dashboard Personalizado por Rol
function DashboardView() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isStaff = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA') || hasRole('ROLE_RECEPCION');

  useEffect(() => {
    const fetchSummary = async () => {
      // Solo el personal clínico consulta el summary global
      if (isStaff) {
        try {
          const data = await dashboardService.getSummary();
          setSummary(data);
        } catch (err) {
          console.error('Error al cargar dashboard summary', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [isStaff]);

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Saludo y Estado General */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
            {isStaff ? 'Panel Clínico' : 'Portal del Paciente'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            ¡Hola, {user?.username}!
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            {isStaff
              ? 'Resumen en tiempo real de actividad clínica y servicios.'
              : 'Bienvenido a tu portal de salud y rehabilitación.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">Sistema en línea</span>
        </div>
      </div>

      {/* TARJETAS PARA PERSONAL CLÍNICO (ADMIN / FISIOTERAPEUTA) */}
      {isStaff ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => navigate('/appointments')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Citas Hoy</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">
                {isLoading ? '...' : summary?.todayAppointmentsCount ?? 0}
              </p>
              <span className="text-xs font-semibold text-teal-600 flex items-center gap-1">
                Ver agenda <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate('/patients')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Pacientes</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">
                {isLoading ? '...' : summary?.totalPatientsCount ?? 0}
              </p>
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                Directorio <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate('/treatments')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Tratamientos</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-slate-900">
                {isLoading ? '...' : summary?.totalTreatmentsCount ?? 0}
              </p>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                Catálogo <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Disponibilidad</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-extrabold text-teal-600">100%</p>
              <span className="text-xs font-medium text-slate-500">Operativo</span>
            </div>
          </div>
        </div>
      ) : (
        /* TARJETAS EXCLUSIVAS PARA PACIENTES */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/appointments')}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Mis Citas</span>
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Agenda tu Sesión</h3>
            <p className="text-xs text-slate-500 mt-1">Consulta tus próximas citas y horarios disponibles.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 mt-4">
              Ir a mis citas <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => navigate('/treatments')}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Servicios</span>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Catálogo Clínico</h3>
            <p className="text-xs text-slate-500 mt-1">Conoce nuestras terapias, duración y costos.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-4">
              Ver tratamientos <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div
            onClick={() => navigate('/profile')}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Seguridad</span>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Mi Perfil</h3>
            <p className="text-xs text-slate-500 mt-1">Gestiona tu contraseña e información de cuenta.</p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mt-4">
              Gestionar cuenta <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      )}

      {/* Próximas Citas (Solo para Personal Clínico) */}
      {isStaff && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Próximas Sesiones de Hoy
          </h2>

          {isLoading ? (
            <div className="py-8 text-center flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
              Cargando citas del día...
            </div>
          ) : summary?.upcomingAppointments && summary.upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {summary.upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-slate-50 hover:bg-teal-50/50 transition rounded-2xl border border-slate-200/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center font-mono bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="block text-sm font-bold text-slate-900">{formatTime(app.appointmentDate)}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{app.patientName || app.patientId}</h3>
                      <p className="text-xs text-slate-600 font-medium">{app.reason}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm">
              No hay citas programadas para el día de hoy.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Rutas accesibles por todos los autenticados */}
        <Route path="/" element={<DashboardView />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/treatments" element={<TreatmentsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Rutas exclusivas para Personal Clínico (Pacientes y Expedientes) */}
        <Route element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA', 'ROLE_RECEPCION']} />}>
          <Route path="/patients" element={<PatientsPage />} />
        </Route>

        <Route element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA']} />}>
          <Route path="/records" element={<RecordsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}