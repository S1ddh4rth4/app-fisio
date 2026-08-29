import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navItems } from '../../routes/navItems';
import { Activity } from 'lucide-react';

export const Sidebar = () => {
    const { user } = useAuth();

    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.some((role) => user?.roles.includes(role));
    });

    return (
        <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-col shrink-0">
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                    <Activity className="w-6 h-6" />
                </div>
                <div>
                    <span className="font-bold text-slate-900 text-lg leading-tight block">FisioApp</span>
                    <span className="text-[11px] text-teal-600 font-semibold tracking-wider uppercase">Portal Clínico</span>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Menú Principal
                </div>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};