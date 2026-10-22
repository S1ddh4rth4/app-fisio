import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../services/patientService';
import { appointmentService } from '../../appointments/services/appointmentService';
import { PatientModal } from './PatientModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { PatientDTO } from '../../../types/patient';
import {
    Users,
    Plus,
    Search,
    Mail,
    Calendar,
    FileText,
    AlertCircle,
    Loader2,
    ShieldCheck,
    X,
    Phone,
    KeyRound,
    CheckCircle2,
    User,
    Stethoscope
} from 'lucide-react';

export const PatientsPage = () => {
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isStaff = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA') || hasRole('ROLE_RECEPCION');
    const isAdmin = hasRole('ROLE_ADMIN');
    const isAdminOrReception = isAdmin || hasRole('ROLE_RECEPCION');
    const [patients, setPatients] = useState<PatientDTO[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<PatientDTO | null>(null);
    const [reassignPhysioUsername, setReassignPhysioUsername] = useState('');
    const [isReassigning, setIsReassigning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPhysioFilter, setSelectedPhysioFilter] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPatients = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await patientService.getAll();
            setPatients(data);
        } catch (err: any) {
            setError('No se pudieron cargar los pacientes.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        if (isAdminOrReception) {
            appointmentService.getProfessionals()
                .then(setProfessionals)
                .catch(() => setProfessionals([]));
        }
    }, [isAdminOrReception]);

    const handleCreated = () => {
        fetchPatients();
    };

    const handleReassignPhysio = async () => {
        if (!selectedPatient || !reassignPhysioUsername) return;
        setIsReassigning(true);
        try {
            const updated = await patientService.assignPhysio(selectedPatient.id, reassignPhysioUsername);
            setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setSelectedPatient(updated);
            alert('Fisioterapeuta asignado actualizado correctamente.');
        } catch (e: any) {
            alert(e.response?.data?.message || 'No se pudo actualizar el fisioterapeuta.');
        } finally {
            setIsReassigning(false);
        }
    };

    const filteredPatients = patients.filter((p) => {
        const matchesSearch =
            (p.fullName && p.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.primaryPhysioName && p.primaryPhysioName.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesPhysio =
            selectedPhysioFilter === 'ALL' ||
            (selectedPhysioFilter === 'UNASSIGNED' && !p.primaryPhysioUsername) ||
            p.primaryPhysioUsername === selectedPhysioFilter;

        return matchesSearch && matchesPhysio;
    });

    // Función de Data Masking
    const maskEmail = (email: string) => {
        if (email && email.toLowerCase().endsWith('@sin-correo.local')) {
            return 'Sin correo (Paciente Ocasional)';
        }
        // Los administradores tienen autorización de máximo nivel para ver datos crudos
        if (hasRole('ROLE_ADMIN')) return email;

        if (!email || !email.includes('@')) return email;
        const [local, domain] = email.split('@');

        // Si el correo es muy corto, solo mostramos la primera letra
        if (local.length <= 2) return `${local[0]}***@${domain}`;

        // Muestra la primera y última letra (Ej: u****a@gmail.com)
        const maskedLocal = `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`;
        return `${maskedLocal}@${domain}`;
    };

    return (
        <div className="space-y-6">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                        Directorio Clínico
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        Gestión de Pacientes
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        Listado completo, datos de contacto y acceso a historiales clínicos.
                    </p>
                </div>

                {isStaff && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => setIsModalOpen(true)}
                        leftIcon={<Plus className="w-5 h-5" />}
                    >
                        Nuevo Paciente
                    </Button>
                )}
            </div>

            {/* Buscador y Filtro por Fisioterapeuta */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar por nombre, usuario, correo o fisioterapeuta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search className="w-5 h-5" />}
                    />
                </div>
                {isAdminOrReception && (
                    <div className="sm:w-72">
                        <select
                            value={selectedPhysioFilter}
                            onChange={(e) => setSelectedPhysioFilter(e.target.value)}
                            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                        >
                            <option value="ALL">Todos los Fisioterapeutas ({patients.length})</option>
                            {professionals.map((doc) => (
                                <option key={doc.id} value={doc.username}>
                                    {doc.fullName ? `${doc.fullName} (@${doc.username})` : `@${doc.username}`}
                                </option>
                            ))}
                            <option value="UNASSIGNED">Sin Fisioterapeuta Asignado</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Listado Responsivo */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Cargando directorio de pacientes...</p>
                </div>
            ) : error ? (
                <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchPatients}>
                        Reintentar
                    </Button>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-4">
                        <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        {searchTerm ? 'No se encontraron coincidencias' : 'Sin pacientes registrados'}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
                        {searchTerm
                            ? 'Intenta con otro término de búsqueda.'
                            : 'Comienza registrando a tu primer paciente para agendar citas y crear expedientes.'}
                    </p>
                    {!searchTerm && isStaff && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsModalOpen(true)}
                            leftIcon={<Plus className="w-5 h-5" />}
                        >
                            Registrar Primer Paciente
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map((patient) => (
                        <div
                            key={patient.id}
                            onClick={() => {
                                setSelectedPatient(patient);
                                setReassignPhysioUsername(patient.primaryPhysioUsername || '');
                            }}
                            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                        >
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base border border-teal-100 group-hover:scale-105 transition-transform">
                                            {(patient.fullName || patient.username).substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                                                {patient.fullName || patient.username}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-mono">@{patient.username}</p>
                                            {patient.enabled ? (
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                                                    <ShieldCheck className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-1">
                                                    <AlertCircle className="w-3 h-3" /> Inactivo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                        {/* Aplicamos la máscara en tiempo real */}
                                        <span className="truncate">{maskEmail(patient.email)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                        <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg truncate ${patient.primaryPhysioName
                                            ? 'bg-teal-50/70 text-teal-800 border border-teal-200/60'
                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                            {patient.primaryPhysioName
                                                ? `Fisio: ${patient.primaryPhysioName}`
                                                : 'Sin Fisio Asignado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="flex flex-col gap-2 pt-4 mt-4 border-t border-slate-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        leftIcon={<Calendar className="w-4 h-4" />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/appointments');
                                        }}
                                    >
                                        Citas
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        leftIcon={<FileText className="w-4 h-4" />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/records?patient=${patient.username}`);
                                        }}
                                    >
                                        Expediente
                                    </Button>
                                </div>

                                {/* Botón exclusivo de administradores (Borrado por error o Derecho al Olvido) */}
                                {hasRole('ROLE_ADMIN') && patient.enabled && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        leftIcon={<AlertCircle className="w-4 h-4" />}
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm("⚠️ ¿Deseas eliminar a este paciente?\n\n• Si fue creado por error (sin citas ni historial), se borrará por completo y su correo quedará libre.\n• Si ya tiene citas o historial clínico, se anonimizará por Derecho al Olvido.")) {
                                                try {
                                                    const res = await patientService.delete(patient.id);
                                                    fetchPatients();
                                                    alert(res.message);
                                                } catch (err: any) {
                                                    alert(err.response?.data?.message || "Error al intentar eliminar. Verifica tus permisos.");
                                                }
                                            }
                                        }}
                                    >
                                        Eliminar / Derecho al Olvido
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Registro de Paciente */}
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreated}
            />

            {/* Modal de Detalles / Ficha del Paciente */}
            {selectedPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center font-bold text-lg border border-teal-100">
                                    {(selectedPatient.fullName || selectedPatient.username).substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                                        {selectedPatient.fullName || selectedPatient.username}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">@{selectedPatient.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-sm">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <User className="w-4 h-4 text-teal-600" /> Perfil Clínico
                                </span>
                                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Paciente
                                </span>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-2xl space-y-2.5">
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span><strong>Correo:</strong> {maskEmail(selectedPatient.email)}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span><strong>Teléfono:</strong> {selectedPatient.phone || 'No registrado'}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
                                    <span>
                                        <strong>Fisioterapeuta:</strong>{' '}
                                        {selectedPatient.primaryPhysioName || 'Sin asignar'}
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="p-3.5 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2">
                                    <label className="block text-[11px] font-bold text-teal-900 uppercase">
                                        Cambiar Fisioterapeuta Asignado (Admin)
                                    </label>
                                    <div className="flex gap-2">
                                        <select
                                            value={reassignPhysioUsername}
                                            onChange={(e) => setReassignPhysioUsername(e.target.value)}
                                            className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="" disabled>-- Seleccionar Fisioterapeuta --</option>
                                            {professionals.map((doc) => (
                                                <option key={doc.id} value={doc.username}>
                                                    Dr/a. {doc.fullName ? `${doc.fullName} (@${doc.username})` : `@${doc.username}`}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="text-xs px-3"
                                            isLoading={isReassigning}
                                            disabled={!reassignPhysioUsername || reassignPhysioUsername === selectedPatient.primaryPhysioUsername}
                                            onClick={handleReassignPhysio}
                                        >
                                            Guardar
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className={`grid ${hasRole('ROLE_ADMIN') ? 'grid-cols-2' : 'grid-cols-1'} gap-2 text-xs`}>
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                        Estado de Cuenta
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        {selectedPatient.enabled ? 'Habilitada' : 'Inactiva'}
                                    </span>
                                </div>

                                {hasRole('ROLE_ADMIN') && (
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                            Doble Factor (2FA)
                                        </span>
                                        <span className={`flex items-center gap-1.5 font-bold ${selectedPatient.mfaEnabled ? 'text-teal-700' : 'text-slate-500'}`}>
                                            <KeyRound className="w-4 h-4" />
                                            {selectedPatient.mfaEnabled ? 'Activo' : 'Desactivado'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {selectedPatient.createdAt && (
                                <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Paciente desde: {new Date(selectedPatient.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            )}
                        </div>

                        {/* Accesos rápidos desde la ficha */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    leftIcon={<Calendar className="w-4 h-4" />}
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        navigate('/appointments');
                                    }}
                                >
                                    Ver Citas
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-1 text-xs"
                                    leftIcon={<FileText className="w-4 h-4" />}
                                    onClick={() => {
                                        const username = selectedPatient.username;
                                        setSelectedPatient(null);
                                        navigate(`/records?patient=${username}`);
                                    }}
                                >
                                    Expediente
                                </Button>
                            </div>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedPatient(null)}
                                className="w-full justify-center mt-1"
                            >
                                Cerrar Ficha
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};