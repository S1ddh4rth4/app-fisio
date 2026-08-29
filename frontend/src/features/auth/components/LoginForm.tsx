import { useState, type FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../services/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Activity, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginForm = () => {
    const { login } = useAuth();
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            const response = await authService.login({ loginIdentifier, password });
            login(response);
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Credenciales inválidas o error de conexión.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
            {/* Brand Header */}
            <div className="w-full max-w-md text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/25 mb-4 ring-8 ring-teal-50">
                    <Activity className="w-9 h-9" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    FisioApp
                </h1>
                <p className="mt-2 text-base text-slate-600 font-medium">
                    Portal de Fisioterapia & Rehabilitación Clínica
                </p>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-md">
                <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-sm border border-slate-200/80">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Iniciar Sesión</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Ingresa tus datos para acceder a tu panel.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-sm text-rose-800">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="font-medium">{errorMsg}</div>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <Input
                            label="Usuario o Correo Electrónico"
                            id="login-identifier"
                            type="text"
                            required
                            placeholder="ej. juanperez o juan@clinica.com"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            leftIcon={<User className="w-5 h-5" />}
                            autoComplete="username"
                        />

                        <Input
                            label="Contraseña"
                            id="login-password"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock className="w-5 h-5" />}
                            autoComplete="current-password"
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                className="w-full"
                                isLoading={isLoading}
                                rightIcon={<ArrowRight className="w-5 h-5" />}
                            >
                                Acceder al Sistema
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Footer info accesible */}
                <p className="mt-8 text-center text-xs text-slate-500 font-medium">
                    Acceso seguro y protegido para personal clínico y pacientes.
                </p>
            </div>
        </div>
    );
};