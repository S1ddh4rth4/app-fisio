import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type AccentColor } from '../../context/ThemeContext';
import { Activity, LogOut, Sun, Moon, Palette } from 'lucide-react';

export const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, color, toggleTheme, setColor } = useTheme();
    const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

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
            <div className="flex items-center gap-3">
                <div
                    className="flex md:hidden items-center justify-center w-9 h-9 rounded-xl text-white shadow-sm transition-colors"
                    style={{ backgroundColor: currentHex }}
                >
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
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};