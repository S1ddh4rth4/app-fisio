import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { paymentService } from '../services/paymentService';
import { patientService } from '../../patients/services/patientService';
import type { PatientPackageResponseDTO } from '../../../types/payment';
import type { PatientDTO } from '../../../types/patient';
import { Package, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface BuyPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newPkg: PatientPackageResponseDTO) => void;
}

export const BuyPackageModal = ({
    isOpen,
    onClose,
    onSuccess,
}: BuyPackageModalProps) => {
    const [patientIdentifier, setPatientIdentifier] = useState('');
    const [packageName, setPackageName] = useState('Paquete de Fisioterapia (10 Sesiones)');

    // Lista para el menú desplegable
    const [patientsList, setPatientsList] = useState<PatientDTO[]>([]);

    useEffect(() => {
        if (isOpen) {
            patientService.getAll().then(data => {
                const activePatients = data.filter(p => p.enabled);
                setPatientsList(activePatients);
                if (activePatients.length > 0) {
                    setPatientIdentifier(activePatients[0].username);
                }
            }).catch(() => { });
        }
    }, [isOpen]);
    const [totalSessions, setTotalSessions] = useState('10');
    const [totalPrice, setTotalPrice] = useState('3500');
    const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const created = await paymentService.buyPackage({
                patientIdentifier,
                packageName,
                totalSessions: parseInt(totalSessions, 10) || 10,
                totalPrice: parseFloat(totalPrice) || 0,
                paymentMethod,
            });

            onSuccess(created);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al registrar la venta del paquete.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Vender Paquete de Sesiones</h2>
                            <p className="text-xs text-slate-500">Asigna un bono de sesiones prepagadas a un paciente.</p>
                        </div>
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Paciente Asignado <span className="text-rose-500">*</span>
                        </label>
                        <select
                            required
                            value={patientIdentifier}
                            onChange={(e) => setPatientIdentifier(e.target.value)}
                            className="w-full h-12 bg-white border border-slate-300 rounded-xl px-4 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                        >
                            <option value="" disabled>-- Selecciona un Paciente --</option>
                            {patientsList.map((p) => (
                                <option key={p.id} value={p.username}>
                                    {p.username} ({p.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Nombre del Paquete"
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                        placeholder="ej. Paquete Lumbalgia 10 Sesiones"
                        required
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Total de Sesiones"
                            type="number"
                            min="1"
                            value={totalSessions}
                            onChange={(e) => setTotalSessions(e.target.value)}
                            required
                        />

                        <Input
                            label="Precio Total Cobrado ($)"
                            type="number"
                            step="50"
                            value={totalPrice}
                            onChange={(e) => setTotalPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                            Método de Pago Recibido
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm font-medium"
                        >
                            <option value="TRANSFERENCIA">Transferencia / SPEI</option>
                            <option value="TARJETA">Tarjeta (Débito/Crédito)</option>
                            <option value="EFECTIVO">Efectivo</option>
                        </select>
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                        <Button variant="outline" size="sm" type="button" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            isLoading={isLoading}
                            leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        >
                            Registrar Venta
                        </Button>
                    </div>
                </form>

            </div>
        </div>
    );
};