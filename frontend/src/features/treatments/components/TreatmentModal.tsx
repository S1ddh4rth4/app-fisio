import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { treatmentService } from '../services/treatmentService';
import type { TreatmentResponseDTO } from '../../../types/treatment';
import { X, Sparkles, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface TreatmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (treatment: TreatmentResponseDTO) => void;
    initialData?: TreatmentResponseDTO | null;
}

export const TreatmentModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialData = null,
}: TreatmentModalProps) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(45);
    const [price, setPrice] = useState(500);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDescription(initialData.description);
            setDurationMinutes(initialData.durationMinutes);
            setPrice(initialData.price);
        } else {
            setName('');
            setDescription('');
            setDurationMinutes(45);
            setPrice(500);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setIsLoading(true);

        try {
            if (initialData) {
                // Modo Edición
                const updated = await treatmentService.update(initialData.id, {
                    name,
                    description,
                    durationMinutes: Number(durationMinutes),
                    price: Number(price),
                });
                onSuccess(updated);
            } else {
                // Modo Creación
                const created = await treatmentService.create({
                    name,
                    description,
                    durationMinutes: Number(durationMinutes),
                    price: Number(price),
                });
                onSuccess(created);
            }
            onClose();
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.message || 'Error al guardar el tratamiento. Verifica los campos.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {initialData ? 'Editar Tratamiento' : 'Nuevo Tratamiento / Terapia'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {initialData ? 'Actualiza los datos del servicio' : 'Agrega un nuevo servicio al catálogo clínico'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="my-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-sm text-rose-800">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <Input
                        label="Nombre del Servicio / Terapia"
                        required
                        placeholder="ej. Punción Seca y Terapia Manual"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        leftIcon={<Sparkles className="w-5 h-5" />}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Duración (Minutos)"
                            type="number"
                            min={15}
                            step={5}
                            required
                            placeholder="ej. 45"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                            leftIcon={<Clock className="w-5 h-5" />}
                            helperText="Mínimo 15 minutos"
                        />

                        <Input
                            label="Precio ($ MXN)"
                            type="number"
                            min={0}
                            step={50}
                            required
                            placeholder="ej. 500"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            leftIcon={<DollarSign className="w-5 h-5" />}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                            Descripción del Tratamiento <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute top-3.5 left-3.5 text-slate-400 pointer-events-none">
                                <FileText className="w-5 h-5" />
                            </div>
                            <textarea
                                required
                                rows={3}
                                placeholder="Describe el objetivo terapéutico, patologías indicadas y técnica empleada..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-base rounded-xl border border-slate-300 hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-600 pl-11 pr-4 py-3 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" size="md" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
                            {initialData ? 'Guardar Cambios' : 'Guardar Tratamiento'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};