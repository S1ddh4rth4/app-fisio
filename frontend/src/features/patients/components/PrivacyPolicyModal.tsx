import { X, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Cabecera */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Aviso de Privacidad y Tratamiento de Datos</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cuerpo del Documento (Con Scroll) */}
                <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4">
                    <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
                    <p>En cumplimiento con las normativas internacionales de protección de información en salud, <strong>FisioApp</strong> le informa que:</p>

                    <h3 className="text-base font-bold text-slate-800 mt-4">1. Recopilación y Uso (Minimización)</h3>
                    <p>Los datos clínicos recabados (diagnósticos, notas de evolución y datos de contacto) serán utilizados única y exclusivamente para la conformación de su expediente clínico, diagnóstico y tratamiento fisioterapéutico.</p>

                    <h3 className="text-base font-bold text-slate-800 mt-4">2. Protección y Cifrado (Seguridad de la Información)</h3>
                    <p>Toda su información médica sensible se encuentra cifrada de extremo a extremo en nuestras bases de datos (Protocolo de Encriptación AES-256). El personal solo accederá a ellos bajo estricta necesidad médica (Principio de Necesidad de Saber).</p>

                    <h3 className="text-base font-bold text-slate-800 mt-4">3. No Divulgación a Terceros</h3>
                    <p>Sus datos personales y médicos no serán vendidos, transferidos ni compartidos con plataformas de terceros no autorizadas. Los datos enviados a calendarios externos se encuentran estrictamente anonimizados.</p>

                    <h3 className="text-base font-bold text-slate-800 mt-4">4. Retención y Derechos del Paciente</h3>
                    <p>Mantenemos su información únicamente durante el tiempo necesario para fines médicos o legales. Usted tiene el derecho de solicitar la anonimización, corrección o eliminación de su expediente clínico comunicándose con la administración.</p>
                </div>

                {/* Pie de página */}
                <div className="p-5 border-t border-slate-100 flex justify-end">
                    <Button variant="primary" onClick={onClose}>Entendido y Aceptado</Button>
                </div>
            </div>
        </div>
    );
};