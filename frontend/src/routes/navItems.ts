import {
    Calendar,
    Users,
    FileText,
    Sparkles,
    LayoutDashboard,
    UserCircle,
    Dumbbell,
    UserCheck,
    type LucideIcon
} from 'lucide-react';

export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    roles?: string[];
}

export const navItems: NavItem[] = [
    {
        label: 'Inicio',
        path: '/',
        icon: LayoutDashboard,
    },
    {
        label: 'Citas',
        path: '/appointments',
        icon: Calendar,
    },
    {
        label: 'Prescripciones',
        path: '/prescriptions',
        icon: Dumbbell,
    },
    {
        label: 'Pacientes',
        path: '/patients',
        icon: Users,
        roles: ['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA', 'ROLE_RECEPCION'],
    },
    {
        label: 'Expedientes',
        path: '/records',
        icon: FileText,
        roles: ['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA', 'ROLE_PACIENTE'],
    },
    {
        label: 'Tratamientos',
        path: '/treatments',
        icon: Sparkles,
    },
    {
        label: 'Equipo',
        path: '/staff',
        icon: UserCheck,
        roles: ['ROLE_ADMIN'],
    },
    {
        label: 'Perfil',
        path: '/profile',
        icon: UserCircle,
    },
];