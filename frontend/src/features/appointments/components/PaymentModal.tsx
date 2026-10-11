import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { paymentService } from '../services/paymentService';
import type { AppointmentResponseDTO } from '../../../types/appointment';
import type { PatientPackageResponseDTO } from '../../../types/payment';
import {
    DollarSign,
    Package,
    CheckCircle2,
    AlertCircle,
    X,
    Sparkles
} from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    appointment: AppointmentResponseDTO | null;
    onClose: () => void;
    onSuccess: (updated: AppointmentResponseDTO) => void;
}

export const PaymentModal = ({
    isOpen,
    appointment,
    onClose,
    onSuccess,
}: PaymentModalProps) => {
    const [paymentStatus, setPaymentStatus] = useState<'PAGADO' | 'PENDIENTE' | 'PAQUETE' | 'CORTESIA'>('PAGADO');
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
    const [amount, setAmount] = useState('500');
    const [patientPackages, setPatientPackages] = useState<PatientPackageResponseDTO[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (appointment && isOpen) {
            setPaymentStatus(appointment.paymentStatus === 'PAQUETE' ? 'PAQUETE' : 'PAGADO');
            setPaymentMethod(appointment.paymentMethod || 'EFECTIVO');
            setAmount(appointment.paymentAmount ? String(appointment.paymentAmount) : '500');
            setError(null);

            // Cargar paquetes disponibles del paciente
            const loadPackages = async () => {
                try {
                    const pkgs = await paymentService.getPatientPackages(appointment.patientId);
                    const activePkgs = pkgs.filter(p => p.status === 'ACTIVO' && p.remainingSessions > 0);
                    setPatientPackages(activePkgs);
                    if (activePkgs.length > 0) {
                        setSelectedPackageId(activePkgs[0].id);
                    }
                } catch {
                    // Ignorar si no tiene paquetes
                }
            };
            loadPackages();
        }
    }, [appointment, isOpen]);

    if (!isOpen || !appointment) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const updated = await paymentService.updateAppointmentPayment(appointment.id, {
                paymentStatus,
                paymentMethod: paymentStatus === 'PAQUETE' ? 'PAQUETE' : paymentMethod,
                amount: paymentStatus === 'PAGADO' ? parseFloat(amount) || 0 : undefined,
                patientPackageId: paymentStatus === 'PAQUETE' ? selectedPackageId : undefined,
            });

            onSuccess(updated);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al procesar el pago de la cita.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">
                            Control de Pagos
                        </span>
                        <h2 className="text-lg font-bold text-slate-900 mt-1">
                            Cobro de Consulta
                        </h2>
                        <p className="text-xs text-slate-500">
                            Paciente: <strong className="text-slate-800">{appointment.patientName || appointment.patientId}</strong>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Feedback Error */}
                {error && (
                    <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Selector de Tipo de Pago */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                            Modalidad de Cobro
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentStatus('PAGADO')}
                                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${paymentStatus === 'PAGADO'
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                                <span>Pago Individual</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentStatus('PAQUETE')}
                                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${paymentStatus === 'PAQUETE'
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Package className="w-4 h-4 text-indigo-600" />
                                <span>De Paquete</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentStatus('CORTESIA')}
                                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${paymentStatus === 'CORTESIA'
                                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                <span>Cortesía (0$)</span>
                            </button>
                        </div>
                    </div>

                    {/* Opciones según modalidad */}
                    {paymentStatus === 'PAGADO' && (
                        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <Input
                                label="Monto Cobrado ($)"
                                type="number"
                                step="50"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                                    Método de Pago
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm font-medium"
                                >
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TARJETA">Tarjeta (Débito/Crédito)</option>
                                    <option value="TRANSFERENCIA">Transferencia / SPEI</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {paymentStatus === 'PAQUETE' && (
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-2">
                            <label className="block text-xs font-bold text-indigo-950 uppercase">
                                Selecciona el Paquete a Descontar (1 Sesión)
                            </label>
                            {patientPackages.length === 0 ? (
                                <p className="text-xs text-rose-600 font-semibold">
                                    El paciente no tiene paquetes activos con sesiones disponibles. Véndele un paquete primero o usa Pago Individual.
                                </p>
                            ) : (
                                <select
                                    value={selectedPackageId}
                                    onChange={(e) => setSelectedPackageId(e.target.value)}
                                    className="w-full h-11 bg-white border border-indigo-300 rounded-xl px-3 text-sm font-medium text-slate-800"
                                >
                                    {patientPackages.map((pkg) => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.packageName} — Quedan {pkg.remainingSessions} de {pkg.totalSessions} sesiones
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Botones de acción */}
                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                        <Button variant="outline" size="sm" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={isLoading}
                            disabled={paymentStatus === 'PAQUETE' && patientPackages.length === 0}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            Confirmar Cobro
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
};