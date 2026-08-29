import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navItems } from '../../routes/navItems';

export const BottomNav = () => {
    const { user } = useAuth();

    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.some((role) => user?.roles.includes(role));
    });

    return (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 px-2 py-2 flex justify-around items-center shadow-lg">
            {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${isActive
                                ? 'text-teal-600 font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] mt-1 font-medium">{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
};