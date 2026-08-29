import { useAuth } from '../../context/AuthContext';
import { Activity, LogOut } from 'lucide-react';

export const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl bg-teal-600 text-white shadow-sm">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-slate-800 leading-tight">
                        FisioApp
                    </h1>
                    <p className="text-xs text-slate-500 hidden sm:block">
                        Portal de Fisioterapia & Rehabilitación Clínica
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
                    <p className="text-xs text-teal-600 font-medium">
                        {user?.roles.map((r) => r.replace('ROLE_', '')).join(', ')}
                    </p>
                </div>
                <button
                    onClick={logout}
                    title="Cerrar sesión"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};