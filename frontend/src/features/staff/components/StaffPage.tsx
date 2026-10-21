import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { staffService } from '../services/staffService';
import { RegisterStaffModal } from './RegisterStaffModal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { StaffUserDTO } from '../../../types/auth';
import {
    UserCheck,
    Plus,
    Search,
    Mail,
    CheckCircle2,
    Loader2,
    AlertCircle,
    User,
    X,
    Phone,
    Award,
    Shield,
    Calendar,
    KeyRound
} from 'lucide-react';

export const StaffPage = () => {
    const { user } = useAuth();
    const [staff, setStaff] = useState<StaffUserDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffUserDTO | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [error, setError] = useState<string | null>(null);

    const fetchStaff = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await staffService.getAllStaff();
            setStaff(data);
        } catch (err: any) {
            setError('No se pudo cargar el equipo de trabajo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleCreated = (newMember: StaffUserDTO) => {
        setStaff((prev) => [newMember, ...prev]);
    };

    const handleToggleStatus = async (staffMember: StaffUserDTO) => {
        const actionLabel = staffMember.enabled ? 'suspender el acceso de' : 'reactivar la cuenta de';
        if (!window.confirm(`¿Deseas ${actionLabel} @${staffMember.username}?`)) return;
        setIsActionLoading(true);
        try {
            const updated = await staffService.toggleStatus(staffMember.id);
            setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setSelectedStaff(updated);
        } catch (err: any) {
            alert(err.response?.data?.message || 'No se pudo cambiar el estado de la cuenta.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteStaff = async (staffMember: StaffUserDTO) => {
        if (!window.confirm(`⚠️ ¿Eliminar definitivamente a @${staffMember.username}?\n\nEsto solo se permite si la cuenta fue creada por error y aún no tiene pacientes, citas ni historias clínicas.`)) {
            return;
        }
        setIsActionLoading(true);
        try {
            const res = await staffService.deleteByMistake(staffMember.id);
            setStaff((prev) => prev.filter((s) => s.id !== staffMember.id));
            setSelectedStaff(null);
            alert(res.message);
        } catch (err: any) {
            alert(err.response?.data?.message || 'No se pudo eliminar la cuenta.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const filteredStaff = staff.filter((s) => {
        const matchesSearch =
            (s.fullName && s.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || s.roles.includes(roleFilter);
        return matchesSearch && matchesRole;
    });

    const getRoleBadge = (roles: string[]) => {
        if (roles.includes('ROLE_ADMIN')) {
            return (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Administrador
                </span>
            );
        }
        if (roles.includes('ROLE_FISIOTERAPEUTA')) {
            return (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                    Fisioterapeuta
                </span>
            );
        }
        return (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Recepción
            </span>
        );
    };

    const physiosCount = staff.filter(s => s.roles.includes('ROLE_FISIOTERAPEUTA')).length;
    const receptionCount = staff.filter(s => s.roles.includes('ROLE_RECEPCION')).length;
    const adminsCount = staff.filter(s => s.roles.includes('ROLE_ADMIN')).length;

    return (
        <div className="space-y-6">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                        Administración
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                        Equipo & Personal Clínico
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                        Directorio de fisioterapeutas, personal de recepción y administradores activos.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsModalOpen(true)}
                    leftIcon={<Plus className="w-5 h-5" />}
                >
                    + Alta de Personal
                </Button>
            </div>

            {/* Tarjetas Métricas Clickeables (Punto 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                    onClick={() => setRoleFilter(roleFilter === 'ROLE_FISIOTERAPEUTA' ? 'ALL' : 'ROLE_FISIOTERAPEUTA')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${roleFilter === 'ROLE_FISIOTERAPEUTA'
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold uppercase">Fisioterapeutas</span>
                        {roleFilter === 'ROLE_FISIOTERAPEUTA' && (
                            <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">Activo</span>
                        )}
                    </div>
                    <p className="text-2xl font-black text-teal-600 mt-1">{physiosCount}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Haz clic para ver fisioterapeutas</p>
                </div>

                <div
                    onClick={() => setRoleFilter(roleFilter === 'ROLE_RECEPCION' ? 'ALL' : 'ROLE_RECEPCION')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${roleFilter === 'ROLE_RECEPCION'
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold uppercase">Recepción</span>
                        {roleFilter === 'ROLE_RECEPCION' && (
                            <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">Activo</span>
                        )}
                    </div>
                    <p className="text-2xl font-black text-blue-600 mt-1">{receptionCount}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Haz clic para ver recepción</p>
                </div>

                <div
                    onClick={() => setRoleFilter(roleFilter === 'ROLE_ADMIN' ? 'ALL' : 'ROLE_ADMIN')}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none ${roleFilter === 'ROLE_ADMIN'
                        ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-bold uppercase">Administradores</span>
                        {roleFilter === 'ROLE_ADMIN' && (
                            <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">Activo</span>
                        )}
                    </div>
                    <p className="text-2xl font-black text-purple-600 mt-1">{adminsCount}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Haz clic para ver administradores</p>
                </div>
            </div>

            {/* Aviso de Filtro Activo */}
            {roleFilter !== 'ALL' && (
                <div className="flex items-center justify-between bg-slate-100 px-4 py-2 rounded-2xl text-xs text-slate-700">
                    <span>
                        Mostrando únicamente miembros con rol: <strong>{roleFilter.replace('ROLE_', '')}</strong> ({filteredStaff.length})
                    </span>
                    <button
                        onClick={() => setRoleFilter('ALL')}
                        className="text-xs font-bold text-teal-600 hover:text-teal-800 hover:underline cursor-pointer"
                    >
                        Mostrar Todo el Personal
                    </button>
                </div>
            )}

            {/* Buscador */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
                <Input
                    placeholder="Buscar personal por nombre o correo electrónico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                />
            </div>

            {/* Listado */}
            {isLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600">Cargando directorio de personal...</p>
                </div>
            ) : error ? (
                <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchStaff}>
                        Reintentar
                    </Button>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <UserCheck className="w-12 h-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-bold text-slate-900">No se encontraron miembros del equipo</h3>
                    <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((member) => (
                        <div
                            key={member.id}
                            onClick={() => setSelectedStaff(member)}
                            className="bg-white p-6 rounded-3xl border border-slate-200/80 hover:border-teal-400 hover:shadow-md transition duration-200 shadow-xs flex flex-col justify-between space-y-4 cursor-pointer group"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold text-base group-hover:scale-105 transition-transform">
                                        <User className="w-5 h-5" />
                                    </div>
                                    {getRoleBadge(member.roles)}
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 text-base group-hover:text-teal-700 transition-colors">
                                        {member.fullName || member.username}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">@{member.username}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>{member.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                {member.enabled ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Cuenta Activa
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-rose-600 font-semibold">
                                        <AlertCircle className="w-3.5 h-3.5" /> Cuenta Suspendida
                                    </span>
                                )}
                                <span className="text-teal-600 font-medium group-hover:underline">
                                    Ver detalles →
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Registro */}
            <RegisterStaffModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreated}
            />

            {/* Modal de Detalles del Miembro del Personal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center font-bold text-lg border border-teal-100">
                                    {(selectedStaff.fullName || selectedStaff.username).substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                                        {selectedStaff.fullName || selectedStaff.username}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-mono">@{selectedStaff.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3.5 text-sm">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-teal-600" /> Rol Asignado
                                </span>
                                {getRoleBadge(selectedStaff.roles)}
                            </div>

                            <div className="p-3 bg-slate-50 rounded-2xl space-y-2.5">
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span><strong>Correo:</strong> {selectedStaff.email}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span><strong>Teléfono:</strong> {selectedStaff.phone || 'No registrado'}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700">
                                    <Award className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span><strong>Cédula Profesional:</strong> {selectedStaff.professionalLicense || 'Sin registrar'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                        Estado de Cuenta
                                    </span>
                                    <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        {selectedStaff.enabled ? 'Habilitada' : 'Inactiva'}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                                        Doble Factor (2FA)
                                    </span>
                                    <span className={`flex items-center gap-1.5 font-bold ${selectedStaff.mfaEnabled ? 'text-teal-700' : 'text-slate-500'}`}>
                                        <KeyRound className="w-4 h-4" />
                                        {selectedStaff.mfaEnabled ? 'Activo' : 'Desactivado'}
                                    </span>
                                </div>
                            </div>

                            {selectedStaff.createdAt && (
                                <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Miembro desde: {new Date(selectedStaff.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                            {selectedStaff.username !== user?.username && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        isLoading={isActionLoading}
                                        onClick={() => handleToggleStatus(selectedStaff)}
                                        className={`text-xs justify-center ${selectedStaff.enabled
                                            ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                            }`}
                                    >
                                        {selectedStaff.enabled ? 'Suspender Cuenta' : 'Reactivar Cuenta'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        isLoading={isActionLoading}
                                        onClick={() => handleDeleteStaff(selectedStaff)}
                                        className="text-xs justify-center border-rose-200 text-rose-600 hover:bg-rose-50"
                                    >
                                        Eliminar (Por Error)
                                    </Button>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedStaff(null)}
                                className="w-full justify-center"
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