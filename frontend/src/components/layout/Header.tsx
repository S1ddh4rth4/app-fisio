import { useState } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type AccentColor } from '../../context/ThemeContext';
import { navItems } from '../../routes/navItems';
import { Activity, LogOut, Sun, Moon, Palette, Menu, X } from 'lucide-react';

export const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, color, toggleTheme, setColor } = useTheme();
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const visibleItems = navItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.some((role) => user?.roles.includes(role));
    });

    const colorOptions: { id: AccentColor; name: string; bg: string; hex: string }[] = [
        { id: 'teal', name: 'Menta Original', bg: 'bg-[#0d9488]', hex: '#0d9488' },
        { id: 'blue', name: 'Azul Océano', bg: 'bg-sky-500', hex: '#0284c7' },
        { id: 'purple', name: 'Púrpura Real', bg: 'bg-purple-600', hex: '#7c3aed' },
        { id: 'rose', name: 'Rosa Brillante', bg: 'bg-pink-500', hex: '#db2777' },
        { id: 'amber', name: 'Naranja Cálido', bg: 'bg-amber-500', hex: '#d97706' },
    ];

    const currentHex = colorOptions.find((c) => c.id === color)?.hex || '#0d9488';

    return (
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
            <div className="flex items-center gap-2.5">
                {/* Botón de Hamburguesa en Móviles */}
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Abrir menú"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Logo clickeable que redirige a Inicio */}
                <Link
                    to="/dashboard"
                    className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition group"
                >
                    <div
                        className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl text-white shadow-sm transition-colors group-hover:scale-105"
                        style={{ backgroundColor: currentHex }}
                    >
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold text-slate-800 leading-tight">
                            AppFisio
                        </h1>
                        <p className="text-xs text-slate-500 hidden sm:block">
                            Portal de Fisioterapia & Rehabilitación Clínica
                        </p>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Selector de Color de Acento: el icono se pinta con el color activo */}
                <div className="relative">
                    <button
                        onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
                        title="Cambiar color del portal"
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                        <Palette className="w-5 h-5 transition-colors" style={{ color: currentHex }} />
                    </button>

                    {isColorMenuOpen && (
                        <div className="absolute right-0 mt-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 flex items-center gap-2 animate-in fade-in zoom-in-95">
                            {colorOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setColor(opt.id);
                                        setIsColorMenuOpen(false);
                                    }}
                                    title={opt.name}
                                    className={`w-7 h-7 rounded-full ${opt.bg} transition-transform hover:scale-110 cursor-pointer ${color === opt.id ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : ''
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Botón de Modo Oscuro / Claro: Luna en oscuro, Sol en claro */}
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Modo Oscuro activo (clic para modo claro)' : 'Modo Claro activo (clic para modo oscuro)'}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                    {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-indigo-400" />
                    ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                    )}
                </button>

                <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                {/* Info de Usuario */}
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
                    <p className="text-xs text-teal-600 font-medium">
                        {user?.roles.map((r) => r.replace('ROLE_', '')).join(', ')}
                    </p>
                </div>

                {/* Cerrar Sesión */}
                <button
                    onClick={() => {
                        logout();
                        navigate('/', { replace: true });
                    }}
                    title="Cerrar sesión"
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>

            {/* Cajón Lateral Desplegable Móvil (Menú de Hamburguesa) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
                        <div>
                            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-2.5 font-bold text-slate-900 text-lg"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <span>AppFisio</span>
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Navegación Principal
                                </div>
                                {visibleItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                                                    ? 'bg-teal-50 text-teal-700 font-bold'
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
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <div className="text-xs mb-3">
                                <p className="font-bold text-slate-800">{user?.username}</p>
                                <p className="text-[11px] text-teal-600 font-medium">
                                    {user?.roles.map((r) => r.replace('ROLE_', '')).join(', ')}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    logout();
                                    navigate('/', { replace: true });
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};