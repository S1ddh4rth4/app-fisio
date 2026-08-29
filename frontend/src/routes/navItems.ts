import {
    Calendar,
    Users,
    FileText,
    Sparkles,
    LayoutDashboard,
    UserCircle,
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
        label: 'Pacientes',
        path: '/patients',
        icon: Users,
        roles: ['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA', 'ROLE_RECEPCION'],
    },
    {
        label: 'Expedientes',
        path: '/records',
        icon: FileText,
        roles: ['ROLE_ADMIN', 'ROLE_FISIOTERAPEUTA'],
    },
    {
        label: 'Tratamientos',
        path: '/treatments',
        icon: Sparkles,
    },
    {
        label: 'Perfil',
        path: '/profile',
        icon: UserCircle,
    },
];