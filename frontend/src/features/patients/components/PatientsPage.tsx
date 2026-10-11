import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { patientService } from '../services/patientService';
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
    ShieldCheck
} from 'lucide-react';

export const PatientsPage = () => {
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    const isStaff = hasRole('ROLE_ADMIN') || hasRole('ROLE_FISIOTERAPEUTA') || hasRole('ROLE_RECEPCION');
    const [patients, setPatients] = useState<PatientDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
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
    }, []);

    const handleCreated = (newPatient: any) => {
        // Al registrarse un paciente, forzamos visualmente a que nazca "Activo" en la pantalla
        setPatients((prev) => [{ ...newPatient, enabled: true }, ...prev]);
    };

    const filteredPatients = patients.filter(
        (p) =>
            p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Función de Data Masking
    const maskEmail = (email: string) => {
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

            {/* Buscador */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <Input
                    placeholder="Buscar paciente por nombre de usuario o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                />
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
                            className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-teal-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base border border-teal-100">
                                            {patient.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base">{patient.username}</h3>
                                            {patient.enabled ? (
                                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-0.5">
                                                    <ShieldCheck className="w-3 h-3" /> Activo
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit mt-0.5">
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
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-slate-100">
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        leftIcon={<Calendar className="w-4 h-4" />}
                                        onClick={() => navigate('/appointments')}
                                    >
                                        Citas
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        leftIcon={<FileText className="w-4 h-4" />}
                                        onClick={() => navigate(`/records?patient=${patient.username}`)}
                                    >
                                        Expediente
                                    </Button>
                                </div>

                                {/* Botón exclusivo de administradores (Derecho al Olvido) */}
                                {hasRole('ROLE_ADMIN') && patient.enabled && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                        leftIcon={<AlertCircle className="w-4 h-4" />}
                                        onClick={async () => {
                                            if (window.confirm("⚠️ ALERTA LEGAL: ¿Seguro que deseas eliminar y anonimizar a este paciente de forma irreversible?")) {
                                                try {
                                                    await patientService.delete(patient.id);
                                                    fetchPatients(); // Recargar lista
                                                    alert("Paciente anonimizado con éxito.");
                                                } catch (e) {
                                                    alert("Error al intentar eliminar. Verifica tus permisos.");
                                                }
                                            }
                                        }}
                                    >
                                        Ejecutar Derecho al Olvido
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <PatientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreated}
            />
        </div>
    );
};