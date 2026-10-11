import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../services/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Activity, Lock, User, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [isMfaRequired, setIsMfaRequired] = useState(false);
    const [mfaCode, setMfaCode] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            // Mandamos los 3 datos al servidor
            const response = await authService.login({
                loginIdentifier,
                password,
                mfaCode: isMfaRequired ? mfaCode : undefined
            });
            login(response);
            navigate('/', { replace: true });

        } catch (err: any) {
            // Si el servidor grita que falta el 2FA, activamos la vista especial
            if (err.response?.data === 'MFA_REQUIRED') {
                setIsMfaRequired(true);
                setErrorMsg(null);
            } else {
                setErrorMsg(err.response?.data?.message || err.response?.data || 'Credenciales inválidas.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{ colorScheme: 'light' }}
            className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8 text-slate-900"
        >
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

                        {isMfaRequired ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center mb-6">
                                    <div className="mx-auto w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mb-3">
                                        <KeyRound className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <h3 className="font-bold text-slate-900">Verificación de 2 Pasos</h3>
                                    <p className="text-sm text-slate-500 mt-1">Abre tu aplicación de autenticación e ingresa el código de 6 dígitos.</p>
                                </div>
                                <Input
                                    label="Código de Autenticación"
                                    id="mfa-code"
                                    type="text"
                                    required
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value)}
                                    className="text-center tracking-[0.5em] text-lg font-bold"
                                />
                            </div>
                        ) : (
                            <>
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
                                    className="!bg-white !text-slate-900 border-slate-300 placeholder:text-slate-400"
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
                                    className="!bg-white !text-slate-900 border-slate-300 placeholder:text-slate-400"
                                />
                            </>
                        )}

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