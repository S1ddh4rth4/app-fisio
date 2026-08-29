import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const AppLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full overflow-x-hidden">
            {/* Sidebar fijo a la izquierda en PC */}
            <Sidebar />

            {/* Contenedor central y Header */}
            <div className="flex-1 flex flex-col min-w-0 w-full">
                <Header />

                {/* pb-24 en móvil para dar espacio al BottomNav, pb-8 en PC */}
                <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>

            {/* Barra de navegación inferior fija abajo en móviles */}
            <BottomNav />
        </div>
    );
};