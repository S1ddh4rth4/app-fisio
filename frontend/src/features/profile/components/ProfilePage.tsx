import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { profileService } from '../services/profileService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
    User,
    Phone,
    Award,
    Camera,
    KeyRound,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Check,
    X,
    Save
} from 'lucide-react';

export const ProfilePage = () => {
    const { user, hasRole, logout } = useAuth();
    const isHealthStaff = hasRole('ROLE_FISIOTERAPEUTA') || hasRole('ROLE_ADMIN');

    // Estado del Perfil
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [professionalLicense, setProfessionalLicense] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
    const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

    // Estado de Cambio de Contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
    const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

    // Cargar perfil al montar
    useEffect(() => {
        profileService.getProfile().then(data => {
            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setProfessionalLicense(data.professionalLicense || '');
            setAvatarUrl(data.avatarUrl || '');
        }).catch(() => { });
    }, []);

    // Conversión de fotografía a Base64
    const handleAvatarFile = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setProfileErrorMsg('La fotografía no debe superar 2 MB de tamaño.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault();
        setProfileErrorMsg(null);
        setProfileSuccessMsg(null);
        setIsSavingProfile(true);

        try {
            await profileService.updateProfile({
                fullName,
                phone,
                professionalLicense: isHealthStaff ? professionalLicense : undefined,
                avatarUrl,
            });
            setProfileSuccessMsg('¡Perfil actualizado con éxito!');
        } catch (err: any) {
            setProfileErrorMsg(err.response?.data?.message || 'Error al guardar los datos del perfil.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Reglas de seguridad de contraseña
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecialChar;

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordErrorMsg(null);
        setPasswordSuccessMsg(null);

        if (!isPasswordValid) {
            setPasswordErrorMsg('La nueva contraseña debe cumplir con todos los requisitos de seguridad.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordErrorMsg('Las nuevas contraseñas no coinciden.');
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await profileService.changePassword({
                currentPassword,
                newPassword,
            });
            setPasswordSuccessMsg(res.message || 'Contraseña actualizada con éxito.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordErrorMsg(
                err.response?.data?.message || 'Error al actualizar contraseña. Verifica tu contraseña actual.'
            );
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header del Módulo */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                    Mi Cuenta
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                    Perfil de Usuario
                </h1>
                <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
                    Gestiona tu información personal, fotografía, cédula y credenciales de acceso.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tarjeta 1: Información Personal y Profesional */}
                <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-600" />
                                Datos de Perfil
                            </h2>
                            <div className="flex flex-wrap gap-1">
                                {user?.roles.map((role) => (
                                    <span
                                        key={role}
                                        className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-lg"
                                    >
                                        {role.replace('ROLE_', '')}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {profileSuccessMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-sm text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{profileSuccessMsg}</span>
                            </div>
                        )}

                        {profileErrorMsg && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-sm text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{profileErrorMsg}</span>
                            </div>
                        )}

                        {/* Foto de Perfil / Avatar */}
                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-teal-500 bg-white flex items-center justify-center shrink-0 shadow-inner">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                    Foto de Perfil
                                </label>
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition shadow-2xs">
                                    <Camera className="w-3.5 h-3.5 text-teal-600" />
                                    Cambiar Fotografía
                                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                                </label>
                                {avatarUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setAvatarUrl('')}
                                        className="block text-[11px] text-rose-500 hover:underline pt-0.5"
                                    >
                                        Eliminar foto
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Campos de texto */}
                        <div className="space-y-3">
                            <Input
                                label="Nombre Completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="ej. Lic. Roberto Gómez"
                            />

                            <Input
                                label="Teléfono de Contacto"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="ej. 55 1234 5678"
                                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                            />

                            {isHealthStaff && (
                                <Input
                                    label="Cédula Profesional Oficial"
                                    value={professionalLicense}
                                    onChange={(e) => setProfessionalLicense(e.target.value)}
                                    placeholder="ej. CED-FISIO-123456"
                                    leftIcon={<Award className="w-4 h-4 text-teal-600" />}
                                />
                            )}

                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                                <span>Usuario: <strong className="text-slate-900 font-mono">{user?.username}</strong></span>
                                <span>Correo: <strong className="text-slate-900">{user?.email}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            size="md"
                            className="w-full"
                            isLoading={isSavingProfile}
                            leftIcon={<Save className="w-4 h-4" />}
                        >
                            Guardar Cambios de Perfil
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={logout}
                            leftIcon={<LogOut className="w-4 h-4" />}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </form>

                {/* Tarjeta 2: Cambiar Contraseña & Asistente */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-teal-600" />
                        Seguridad & Contraseña
                    </h2>

                    {passwordSuccessMsg && (
                        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-sm text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{passwordSuccessMsg}</span>
                        </div>
                    )}

                    {passwordErrorMsg && (
                        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{passwordErrorMsg}</span>
                        </div>
                    )}

                    {/* Caja de Consejos de Seguridad */}
                    <div className="mb-5 p-4 bg-teal-50/70 border border-teal-200/70 rounded-2xl">
                        <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider mb-1.5">
                            <Lightbulb className="w-4 h-4 text-teal-600" />
                            ¿Cómo crear una contraseña segura?
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">
                            💡 <strong>Tip pro:</strong> En lugar de una palabra simple, usa una <em>frase memorable</em> combinando palabras, números y símbolos (ejemplo: <span className="font-mono font-bold bg-white text-teal-800 dark:bg-slate-800 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200 dark:border-slate-700 shadow-2xs">Fisio.Fuerte#2026</span>).
                        </p>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input
                            label="Contraseña Actual"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />

                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            required
                            placeholder="Mínimo 8 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />

                        {/* Checklist visual interactivo */}
                        {newPassword.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <span className={`flex items-center gap-1.5 font-medium ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Mínimo 8 caracteres
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasUppercase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Una Mayúscula (A-Z)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Un Número (0-9)
                                </span>
                                <span className={`flex items-center gap-1.5 font-medium ${hasSpecialChar ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
                                    {hasSpecialChar ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                    Símbolo (!@#$%)
                                </span>
                            </div>
                        )}

                        <Input
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            required
                            placeholder="Repite la nueva contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                className="w-full"
                                isLoading={isSavingPassword}
                                disabled={!isPasswordValid || newPassword !== confirmPassword || !currentPassword}
                            >
                                Actualizar Contraseña
                            </Button>

                            {newPassword.length > 0 && !isPasswordValid && (
                                <p className="text-[11px] text-amber-600 font-medium text-center mt-2">
                                    Completa los 4 requisitos de seguridad para activar el botón.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};