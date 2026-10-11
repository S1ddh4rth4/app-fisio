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
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-50 px-2 py-1.5 flex items-center justify-between overflow-x-auto gap-1 shadow-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:none">
            {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all shrink-0 min-w-[56px] ${isActive
                                ? 'text-teal-600 font-bold bg-teal-50/80'
                                : 'text-slate-500 hover:text-slate-800'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-[10px] mt-0.5 font-medium leading-tight text-center whitespace-nowrap">
                            {item.label}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
};