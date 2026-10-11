import {
    useState,
    useEffect,
    useRef,
    type FormEvent,
    type ReactNode,
    type MouseEvent
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../services/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
    Activity,
    Lock,
    User,
    AlertCircle,
    ArrowRight,
    KeyRound,
    ChevronDown,
    Building2,
    UserCheck,
    HeartHandshake,
    CalendarCheck,
    Wallet,
    PackageCheck,
    ShieldCheck,
    Smartphone,
    FileLock2,
    FileText,
    ClipboardList,
    PenTool,
    Dumbbell,
    MessageCircle,
    Mail,
    ArrowUp,
    CheckCircle2
} from 'lucide-react';

// ================= DATOS DE CONTACTO DEL CREADOR =================
const CREATOR_NAME = 'Siddhartha — Desarrollo de Software & Soluciones tecnológicas';
const CONTACT_WHATSAPP = '525520914382';
const CONTACT_EMAIL = 'app.fisio420@gmail.com';

// ================= 1. MOTOR DE SCROLL INERCIAL (ESTILO LENIS) =================
const useInertialScroll = () => {
    const targetScrollRef = useRef(0);
    const currentScrollRef = useRef(0);
    const isAnimatingRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (prefersReduced || isTouchDevice) return;

        targetScrollRef.current = window.scrollY;
        currentScrollRef.current = window.scrollY;

        const updateScroll = () => {
            const diff = targetScrollRef.current - currentScrollRef.current;

            // Interpolación amortiguada (factor 0.09 = inercia sedosa tipo Lenis)
            if (Math.abs(diff) > 0.4) {
                currentScrollRef.current += diff * 0.09;
                window.scrollTo(0, currentScrollRef.current);
                rafIdRef.current = requestAnimationFrame(updateScroll);
            } else {
                currentScrollRef.current = targetScrollRef.current;
                window.scrollTo(0, targetScrollRef.current);
                isAnimatingRef.current = false;
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) return; // Permitir zoom normal con Ctrl + rueda
            e.preventDefault();

            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            if (!isAnimatingRef.current) {
                targetScrollRef.current = window.scrollY;
                currentScrollRef.current = window.scrollY;
            }

            targetScrollRef.current = Math.max(
                0,
                Math.min(maxScroll, targetScrollRef.current + e.deltaY * 0.95)
            );

            if (!isAnimatingRef.current) {
                isAnimatingRef.current = true;
                rafIdRef.current = requestAnimationFrame(updateScroll);
            }
        };

        const syncOnNativeScroll = () => {
            if (!isAnimatingRef.current) {
                targetScrollRef.current = window.scrollY;
                currentScrollRef.current = window.scrollY;
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('scroll', syncOnNativeScroll, { passive: true });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('scroll', syncOnNativeScroll);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    const glideTo = (targetY: number) => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (prefersReduced || isTouchDevice) {
            window.scrollTo({ top: targetY, behavior: 'smooth' });
            return;
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetY));
        currentScrollRef.current = window.scrollY;

        if (!isAnimatingRef.current) {
            isAnimatingRef.current = true;
            const animateGlide = () => {
                const diff = targetScrollRef.current - currentScrollRef.current;
                if (Math.abs(diff) > 0.5) {
                    currentScrollRef.current += diff * 0.085;
                    window.scrollTo(0, currentScrollRef.current);
                    rafIdRef.current = requestAnimationFrame(animateGlide);
                } else {
                    currentScrollRef.current = targetScrollRef.current;
                    window.scrollTo(0, targetScrollRef.current);
                    isAnimatingRef.current = false;
                }
            };
            rafIdRef.current = requestAnimationFrame(animateGlide);
        }
    };

    return { glideTo };
};

// ================= 2. TARJETA CON FÍSICA DE RESORTE Y SPOTLIGHT AL CURSOR =================
interface SpringCardProps {
    children: ReactNode;
    className?: string;
    dark?: boolean;
    tiltIntensity?: number;
}

const SpringCard = ({
    children,
    className = '',
    dark = false,
    tiltIntensity = 6
}: SpringCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    // Estado físico del resorte (Ley de Hooke: F = -k*x - d*v)
    const physics = useRef({
        rx: 0,
        ry: 0,
        scale: 1,
        lift: 0,
        vx: 0,
        vy: 0,
        vScale: 0,
        vLift: 0,
        targetRx: 0,
        targetRy: 0,
        targetScale: 1,
        targetLift: 0,
        mouseX: 0,
        mouseY: 0,
        hovered: false
    });

    const startSpringLoop = () => {
        if (rafRef.current !== null) return;

        const stiffness = 0.12; // Rigidez del resorte
        const damping = 0.76;   // Amortiguación para rebote suave sin vibración excesiva

        const step = () => {
            const p = physics.current;

            p.vx = (p.vx + (p.targetRx - p.rx) * stiffness) * damping;
            p.vy = (p.vy + (p.targetRy - p.ry) * stiffness) * damping;
            p.vScale = (p.vScale + (p.targetScale - p.scale) * stiffness) * damping;
            p.vLift = (p.vLift + (p.targetLift - p.lift) * stiffness) * damping;

            p.rx += p.vx;
            p.ry += p.vy;
            p.scale += p.vScale;
            p.lift += p.vLift;

            if (cardRef.current) {
                cardRef.current.style.transform = `perspective(1000px) translate3d(0, ${p.lift.toFixed(2)}px, 0) rotateX(${p.rx.toFixed(2)}deg) rotateY(${p.ry.toFixed(2)}deg) scale3d(${p.scale.toFixed(4)}, ${p.scale.toFixed(4)}, 1)`;
            }

            const isMoving =
                Math.abs(p.vx) > 0.005 ||
                Math.abs(p.vy) > 0.005 ||
                Math.abs(p.vScale) > 0.0005 ||
                Math.abs(p.vLift) > 0.005 ||
                Math.abs(p.targetRx - p.rx) > 0.01 ||
                Math.abs(p.targetRy - p.ry) > 0.01 ||
                Math.abs(p.targetScale - p.scale) > 0.001 ||
                Math.abs(p.targetLift - p.lift) > 0.01;

            if (isMoving) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(step);
    };

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const normX = (x / rect.width) * 2 - 1;  // Rango [-1, 1]
        const normY = (y / rect.height) * 2 - 1; // Rango [-1, 1]

        const p = physics.current;
        p.mouseX = x;
        p.mouseY = y;
        p.hovered = true;
        p.targetRx = -normY * tiltIntensity;
        p.targetRy = normX * tiltIntensity;
        p.targetScale = 1.018;
        p.targetLift = -5;

        if (glowRef.current) {
            glowRef.current.style.opacity = '1';
            glowRef.current.style.background = dark
                ? `radial-gradient(380px circle at ${x}px ${y}px, rgba(45, 212, 191, 0.18), transparent 70%)`
                : `radial-gradient(420px circle at ${x}px ${y}px, rgba(13, 148, 136, 0.11), transparent 70%)`;
        }

        startSpringLoop();
    };

    const handleMouseLeave = () => {
        const p = physics.current;
        p.hovered = false;
        p.targetRx = 0;
        p.targetRy = 0;
        p.targetScale = 1;
        p.targetLift = 0;

        if (glowRef.current) {
            glowRef.current.style.opacity = '0';
        }

        startSpringLoop();
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ willChange: 'transform', transformStyle: 'preserve-3d' }}
            className={`relative overflow-hidden transition-shadow duration-300 hover:shadow-xl ${dark ? 'hover:shadow-teal-950/50 hover:border-teal-500/40' : 'hover:shadow-teal-900/5 hover:border-teal-300/80'
                } ${className}`}
        >
            {/* Halo de luz que sigue milimétricamente al cursor */}
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
};

// ================= 3. REVELACIÓN EN SCROLL CON CURVA DE RESORTE =================
interface ScrollRevealProps {
    children: ReactNode;
    delayMs?: number;
    className?: string;
}

const ScrollReveal = ({ children, delayMs = 0, className = '' }: ScrollRevealProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{
                transitionDelay: `${delayMs}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className={`transition-all duration-1000 ${isVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-10 scale-[0.97]'
                } ${className}`}
        >
            {children}
        </div>
    );
};

export const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { glideTo } = useInertialScroll();

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
            const response = await authService.login({
                loginIdentifier,
                password,
                mfaCode: isMfaRequired ? mfaCode : undefined
            });
            login(response);
            navigate('/', { replace: true });

        } catch (err: any) {
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

    const scrollToInfo = () => {
        const infoEl = document.getElementById('fisioapp-info');
        if (infoEl) {
            glideTo(infoEl.offsetTop);
        }
    };

    const scrollToTop = () => {
        glideTo(0);
    };

    const whatsappUrl = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(
        'Hola, vi la plataforma FisioApp y me gustaría recibir información sobre cómo implementarla o contratar tus servicios de desarrollo.'
    )}`;

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        'Información sobre FisioApp / Servicios de Desarrollo'
    )}&body=${encodeURIComponent(
        'Hola,\n\nMe interesa conocer más sobre la plataforma FisioApp y tus servicios de desarrollo.\n\nSaludos.'
    )}`;

    return (
        <div style={{ colorScheme: 'light' }} className="bg-slate-50 text-slate-900">
            {/* ================= PANTALLA 1: LOGIN ESTABLE (ACCESIBLE PARA 3RA EDAD) ================= */}
            <div className="min-h-screen flex flex-col justify-between items-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="hidden sm:block" />

                <div className="w-full max-w-md my-auto">
                    {/* Brand Header */}
                    <div className="text-center mb-8">
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

                    {/* Form Card (100% Firme y Estático para facilitar clic y lectura) */}
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
                                        <p className="text-sm text-slate-500 mt-1">
                                            Abre tu aplicación de autenticación e ingresa el código de 6 dígitos.
                                        </p>
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

                    <p className="mt-6 text-center text-xs text-slate-500 font-medium">
                        Acceso seguro y protegido para personal clínico y pacientes.
                    </p>
                </div>

                {/* Indicador sutil para hacer scroll y conocer FisioApp */}
                <button
                    type="button"
                    onClick={scrollToInfo}
                    className="mt-6 inline-flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/80 border border-slate-200/80 shadow-2xs text-xs font-semibold text-teal-700 hover:text-teal-800 hover:border-teal-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                    <span>¿Eres fisioterapeuta o clínica? Conoce más sobre FisioApp</span>
                    <ChevronDown className="w-4 h-4 animate-bounce text-teal-600" />
                </button>
            </div>

            {/* ================= CONTENIDO INTERACTIVO AL HACER SCROLL ================= */}
            <div id="fisioapp-info" className="border-t border-slate-200 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">

                    {/* 1. ¿PARA QUIÉN ES FISIOAPP? */}
                    <section className="space-y-10">
                        <ScrollReveal>
                            <div className="text-center max-w-3xl mx-auto space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                                    ¿Para quién es FisioApp?
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Diseñado para modernizar la práctica fisioterapéutica
                                </h2>
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                    Una plataforma integral en la nube donde cada especialista y paciente cuenta con un entorno privado, ágil y estructurado.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ScrollReveal delayMs={0}>
                                <SpringCard className="h-full p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm mb-4">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        Clínicas y Centros de Rehabilitación
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Coordina múltiples fisioterapeutas bajo una misma clínica manteniendo la cartera de pacientes, tratamientos e ingresos de cada profesional completamente organizados.
                                    </p>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={100}>
                                <SpringCard className="h-full p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm mb-4">
                                        <UserCheck className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        Fisioterapeutas Independientes
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Olvídate del papel y las hojas de cálculo. Lleva el control de tu agenda, valoraciones biomecánicas, paquetes de sesiones y evolución clínica desde tu computadora, tablet o celular.
                                    </p>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={200}>
                                <SpringCard className="h-full p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-sm mb-4">
                                        <HeartHandshake className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                                        Pacientes en Rehabilitación
                                    </h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        Cada paciente recibe acceso personal para consultar sus próximas citas, revisar sus sesiones disponibles en paquete y seguir paso a paso las rutinas de ejercicios prescritas.
                                    </p>
                                </SpringCard>
                            </ScrollReveal>
                        </div>
                    </section>

                    {/* 2. GESTIÓN Y FINANZAS MULTI-FISIOTERAPEUTA */}
                    <section className="space-y-10">
                        <ScrollReveal>
                            <div className="text-center max-w-3xl mx-auto space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                                    Gestión & Finanzas
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Control operativo y financiero sin fugas
                                </h2>
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                    Automatiza la administración de tu consultorio desde que se agenda la cita hasta el corte de ingresos mensuales.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ScrollReveal delayMs={0}>
                                <SpringCard className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 mb-3">
                                        <CalendarCheck className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                                        Agenda Inteligente & Horarios
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Consulta de disponibilidad en tiempo real por especialista, prevención de choques de horario y clasificación por tipo de sesión (Valoración Inicial o Seguimiento).
                                    </p>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={100}>
                                <SpringCard className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 mb-3">
                                        <PackageCheck className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                                        Paquetes de Sesiones Automatizados
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Vende bonos o paquetes (ej. 5 o 10 sesiones) y descuenta automáticamente cada asistencia al cerrar la cita, mostrando siempre el saldo de sesiones restantes.
                                    </p>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={200}>
                                <SpringCard className="h-full p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 mb-3">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 mb-1.5">
                                        Carteras & Tarifas Independientes
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        Cada fisioterapeuta administra su propio catálogo de tratamientos, precios y métricas de ingresos en efectivo, tarjeta o transferencia con aislamiento total.
                                    </p>
                                </SpringCard>
                            </ScrollReveal>
                        </div>
                    </section>

                    {/* 3. SEGURIDAD Y PRIVACIDAD (BLOQUE CONTRASTADO CON LUZ ESMERALDA AL CURSOR) */}
                    <ScrollReveal>
                        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white space-y-8 shadow-xl shadow-slate-900/10">
                            <div className="max-w-3xl space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-950/80 px-3.5 py-1 rounded-full border border-teal-800">
                                    Seguridad & Privacidad Clínica
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                    Protección de datos médicos con estándares bancarios
                                </h2>
                                <p className="text-sm text-slate-300 leading-relaxed">
                                    La información sensible de tus pacientes está blindada en cada capa del sistema para cumplir con las normativas de protección de datos personales y salud.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SpringCard
                                    dark
                                    className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700"
                                >
                                    <FileLock2 className="w-6 h-6 text-teal-400 mb-3" />
                                    <h3 className="text-base font-bold text-white mb-2">
                                        Cifrado Clínico AES
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        Los diagnósticos y notas de evolución se encriptan antes de guardarse en la base de datos, garantizando confidencialidad absoluta.
                                    </p>
                                </SpringCard>

                                <SpringCard
                                    dark
                                    className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700"
                                >
                                    <Smartphone className="w-6 h-6 text-teal-400 mb-3" />
                                    <h3 className="text-base font-bold text-white mb-2">
                                        Verificación en 2 Pasos (2FA)
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        Compatible con Google Authenticator, Microsoft Authenticator y la app Contraseñas de Apple (iOS/macOS) mediante código QR.
                                    </p>
                                </SpringCard>

                                <SpringCard
                                    dark
                                    className="p-6 rounded-2xl bg-slate-800/90 border border-slate-700"
                                >
                                    <ShieldCheck className="w-6 h-6 text-teal-400 mb-3" />
                                    <h3 className="text-base font-bold text-white mb-2">
                                        Privacidad & Derecho al Olvido
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        Registro auditable de aceptación de Aviso de Privacidad, aislamiento anti-espionaje por rol y anonimización irreversible de expedientes.
                                    </p>
                                </SpringCard>
                            </div>
                        </section>
                    </ScrollReveal>

                    {/* 4. CARACTERÍSTICAS CLÍNICAS ESPECIALIZADAS */}
                    <section className="space-y-10">
                        <ScrollReveal>
                            <div className="text-center max-w-3xl mx-auto space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
                                    Expediente Clínico Digital
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    Herramientas clínicas creadas para fisioterapeutas
                                </h2>
                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                                    Todo el flujo biomecánico y documental que exige la práctica profesional integrado en una sola pantalla.
                                </p>
                            </div>
                        </ScrollReveal>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <ScrollReveal delayMs={0}>
                                <SpringCard
                                    tiltIntensity={4}
                                    className="h-full p-6 rounded-3xl bg-slate-50 border border-slate-200/80"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-2xl bg-teal-600 text-white shrink-0 shadow-sm">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-bold text-slate-900">
                                                Historia Clínica de 7 Hojas + Mapa Corporal Interactivo
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                Signos vitales, antecedentes patológicos, escala visual analógica (EVA 0-10), marcaje táctil sobre silueta anatómica, goniometría articular (ROM), fuerza muscular (Daniels), postura, marcha y diagnóstico CIE-10 / CIF listos para imprimir en PDF.
                                            </p>
                                        </div>
                                    </div>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={100}>
                                <SpringCard
                                    tiltIntensity={4}
                                    className="h-full p-6 rounded-3xl bg-slate-50 border border-slate-200/80"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-2xl bg-teal-600 text-white shrink-0 shadow-sm">
                                            <PenTool className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-bold text-slate-900">
                                                Doble Firma Digital en Pantalla (Canvas Táctil)
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                Recaba la firma autógrafa digital del paciente en el consentimiento informado y sella cada valoración con la firma y cédula profesional del fisioterapeuta.
                                            </p>
                                        </div>
                                    </div>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={150}>
                                <SpringCard
                                    tiltIntensity={4}
                                    className="h-full p-6 rounded-3xl bg-slate-50 border border-slate-200/80"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-2xl bg-teal-600 text-white shrink-0 shadow-sm">
                                            <ClipboardList className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-bold text-slate-900">
                                                Inmutabilidad Normativa (NOM-004) y Adendas Fechadas
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                Las notas de sesiones finalizadas quedan selladas contra alteraciones. Cualquier ampliación posterior se agrega como una Adenda Clínica con sello de fecha y hora.
                                            </p>
                                        </div>
                                    </div>
                                </SpringCard>
                            </ScrollReveal>

                            <ScrollReveal delayMs={250}>
                                <SpringCard
                                    tiltIntensity={4}
                                    className="h-full p-6 rounded-3xl bg-slate-50 border border-slate-200/80"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-2xl bg-teal-600 text-white shrink-0 shadow-sm">
                                            <Dumbbell className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <h3 className="text-base font-bold text-slate-900">
                                                Prescripción de Rutinas y Ejercicios Terapéuticos
                                            </h3>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                Asigna planes personalizados con series, repeticiones, frecuencia e indicaciones posturales que el paciente puede consultar desde su propio teléfono.
                                            </p>
                                        </div>
                                    </div>
                                </SpringCard>
                            </ScrollReveal>
                        </div>
                    </section>

                    {/* 5. SECCIÓN DE CONTACTO Y CONTRATACIÓN DEL CREADOR */}
                    <ScrollReveal>
                        <SpringCard
                            tiltIntensity={2.5}
                            className="p-8 sm:p-12 rounded-3xl bg-teal-50/80 border border-teal-200"
                        >
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                <div className="space-y-3 max-w-2xl text-center lg:text-left">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                                        Implementación & Desarrollo de Software
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                        ¿Quieres implementar FisioApp en tu clínica o necesitas un sistema a medida?
                                    </h2>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        Ponte en contacto directo con el creador de <strong>FisioApp</strong> para contratar una licencia para tu clínica, solicitar una demostración guiada o cotizar el desarrollo de una plataforma personalizada para tu negocio.
                                    </p>
                                    <p className="text-xs font-semibold text-teal-900 pt-1">
                                        Desarrollado por: {CREATOR_NAME}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 hover:scale-[1.03] active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-teal-600/20 transition-all duration-200"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Contactar por WhatsApp
                                    </a>

                                    <a
                                        href={mailtoUrl}
                                        className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.98] text-slate-800 font-bold text-sm border border-slate-300 transition-all duration-200"
                                    >
                                        <Mail className="w-5 h-5 text-teal-600" />
                                        Enviar Correo Electrónico
                                    </a>
                                </div>
                            </div>
                        </SpringCard>
                    </ScrollReveal>

                    {/* Footer final con botón para subir al Login */}
                    <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <p>© {new Date().getFullYear()} FisioApp — Todos los derechos reservados.</p>
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-teal-50 font-semibold text-teal-700 hover:text-teal-800 transition-all duration-200 cursor-pointer"
                        >
                            <ArrowUp className="w-4 h-4" />
                            Subir a Iniciar Sesión
                        </button>
                    </footer>

                </div>
            </div>
        </div>
    );
};