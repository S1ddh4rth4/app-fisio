import { useState, useEffect } from 'react';
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
    User
} from 'lucide-react';

export const StaffPage = () => {
    const [staff, setStaff] = useState<StaffUserDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const filteredStaff = staff.filter(
        (s) =>
            s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (roles: string[]) => {
        if (roles.includes('ROLE_ADMIN')) {
            return (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Administrador
                </span>
            );
        }
        if (roles.includes('ROLE_FISIOTERAPEUTA')) {
            return (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Fisioterapeuta
                </span>
            );
        }
        return (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
            <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full">
                        Administración
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                        Equipo & Personal Clínico
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-1 font-medium">
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

            {/* Tarjetas Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Fisioterapeutas</span>
                    <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{physiosCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Recepción</span>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{receptionCount}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Administradores</span>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{adminsCount}</p>
                </div>
            </div>

            {/* Buscador */}
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <Input
                    placeholder="Buscar personal por nombre o correo electrónico..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5" />}
                />
            </div>

            {/* Listado */}
            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Cargando directorio de personal...</p>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-rose-200 dark:border-rose-800 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{error}</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchStaff}>
                        Reintentar
                    </Button>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center">
                    <UserCheck className="w-12 h-12 text-slate-400 mb-3" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron miembros del equipo</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Intenta con otro término de búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map((member) => (
                        <div
                            key={member.id}
                            className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-500 transition duration-200 shadow-xs flex flex-col justify-between space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="w-11 h-11 bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center font-bold text-base">
                                        <User className="w-5 h-5" />
                                    </div>
                                    {getRoleBadge(member.roles)}
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        {member.username}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span>{member.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Cuenta Activa
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                    ID: {member.id.substring(0, 8)}...
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
        </div>
    );
};