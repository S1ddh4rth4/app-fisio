import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { clinicalHistoryService } from '../services/clinicalHistoryService';
import type { ClinicalHistoryData, ClinicalHistoryResponseDTO } from '../../../types/clinicalHistory';
import {
    Save,
    Printer,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    X,
    Activity,
    HeartPulse,
    Pill,
    ShieldCheck,
    PhoneCall,
    UserCheck
} from 'lucide-react';

interface ClinicalHistoryViewerProps {
    patientId: string;
    patientUsername: string;
    initialHistory?: ClinicalHistoryResponseDTO | null;
    onClose: () => void;
    onSaved?: () => void;
}

const defaultFormData: ClinicalHistoryData = {
    patientName: '',
    birthDate: '',
    curp: '',
    address: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    occupation: '',
    gender: 'M',
    age: '',
    maritalStatus: '',
    education: '',
    recordNumber: '',
    evaluationDate: new Date().toISOString().split('T')[0],
    therapistName: '',
    weight: '',
    height: '',
    bmi: '',
    ethnicity: '',
    consultationReason: '',
    previousTreatments: '',
    currentMedication: '',
    pathologicalHistory: {
        diabetes: { yes: false, no: true, details: '' },
        alergias: { yes: false, no: true, details: '' },
        hta: { yes: false, no: true, details: '' },
        cancer: { yes: false, no: true, details: '' },
        transfusiones: { yes: false, no: true, details: '' },
        reumaticas: { yes: false, no: true, details: '' },
        encames: { yes: false, no: true, details: '' },
        accidentes: { yes: false, no: true, details: '' },
        cardiopatias: { yes: false, no: true, details: '' },
        cirugias: { yes: false, no: true, details: '' },
        fracturas: { yes: false, no: true, details: '' },
    },
    vitals: { bp: '120/80', temp: '36.5', hr: '72', rr: '18', spo2: '98%' },
    spasms: { present: false, location: '' },
    habits: {
        tabaquismo: { yes: false, no: true, details: '' },
        alcoholismo: { yes: false, no: true, details: '' },
        drogas: { yes: false, no: true, details: '' },
        actividadFisica: { yes: true, no: false, details: '' },
        automedicacion: { yes: false, no: true, details: '' },
        pasatiempo: { yes: true, no: false, details: '' },
    },
    pregnancy: { isPregnant: false, details: '', childrenCount: '0' },
    rehabDiagnosis: { reflexes: 'Conservados', sensitivity: 'Normoestesia', language: 'Orientado', other: '' },
    surgicalScar: { location: '', keloid: false, retractile: false, open: false, adherent: false, hypertrophic: false },
    transfers: { initial: 'Independiente', final: 'Independiente' },
    gaitDeambulation: { free: true, spastic: false, claudicating: false, ataxic: false, withHelp: false, other: '', observations: '' },
    painScale: 0,

    muscleEvaluation: {
        ms: { eval1L: '5', eval1R: '5', eval2L: '5', eval2R: '5' },
        mi: { eval1L: '5', eval1R: '5', eval2L: '5', eval2R: '5' },
        trunk: { eval1L: '5', eval1R: '5', eval2L: '5', eval2R: '5' },
        neck: { eval1L: '5', eval1R: '5', eval2L: '5', eval2R: '5' },
    },
    goniometry: {
        ms: { eval1L: '', eval1R: '', eval2L: '', eval2R: '' },
        mi: { eval1L: '', eval1R: '', eval2L: '', eval2R: '' },
        trunk: { eval1L: '', eval1R: '', eval2L: '', eval2R: '' },
        neck: { eval1L: '', eval1R: '', eval2L: '', eval2R: '' },
    },
    initialSoap: { subjective: '', objective: '', analysis: '', plan: '' },

    upperLimbs: {
        shoulder: { flexion: '180', extension: '50', abd: '180', add: '30' },
        shoulderObs: '',
        elbow: { flexion: '145', extension: '0', extRot: '90', intRot: '70' },
        elbowObs: '',
        forearm: { supination: '90', pronation: '90', extRot: '', intRot: '', ulnarDev: '30', radialDev: '20' },
        forearmObs: '',
        wristFingers: {
            palmarFlex: '80',
            dorsalExt: '70',
            fingers: {
                indice: { mcf: '90', ifp: '100', ifd: '90', abd: '20' },
                medio: { mcf: '90', ifp: '100', ifd: '90', abd: '20' },
                anular: { mcf: '90', ifp: '100', ifd: '90', abd: '20' },
                menique: { mcf: '90', ifp: '100', ifd: '90', abd: '20' },
                pulgar: { mcf: '50', ifp: '80', ifd: '', abd: '70' },
            },
        },
        wristObs: '',
    },

    lowerLimbs: {
        hip: { flexExtKnee: '120', hipExt: '30', abd: '45', add: '30' },
        hipObs: '',
        knee: { flexExtKnee: '135', kneeFlex: '135', kneeExt: '0' },
        kneeObs: '',
        ankle: { plantFlex: '50', dorsiFlex: '20', inversion: '35', eversion: '15', extRot: '', intRot: '' },
        ankleObs: '',
    },

    gaitAnalysis: {
        initialStep: 'No vacilante',
        stepLengthHeight: {},
        stepSymmetry: 'Simétrico',
        stepContinuity: 'Continuos',
        trajectory: 'Derecho sin utilizar ayudas',
        trunk: 'No balanceo ni flexión',
        gaitPosture: 'Talones separados',
        gaitScore: 'Normal',
    },

    posturalEvaluation: {
        frontal: '',
        lateral: '',
        posterior: '',
    },

    functionalBattery: {
        balanceTests: { feetTogether: '10 seg', semiTandem: '10 seg', tandem: '10 seg', balanceScore: '4/4', notPerformedReason: '' },
        comments: '',
    },
    comprehensivePlan: {
        objectives: '',
        hypothesis: '',
        bodyStructure: '',
        bodyFunction: '',
        activity: '',
        participation: '',
        medicalDiagnosis: '',
        cieCode: 'M54.5',
        treatmentPlan: '',
        cifDiagnosis: '',
        cifCode: '',
        physioSignature: '',
        physioLicense: 'CED-FISIO-123456',
        informedConsentAccepted: true,
        patientSignature: '',
    },
};

export const ClinicalHistoryViewer = ({
    patientId,
    patientUsername,
    initialHistory = null,
    onClose,
    onSaved,
}: ClinicalHistoryViewerProps) => {
    const { user, hasRole } = useAuth();
    const isPatient = hasRole('ROLE_PACIENTE');
    const [currentPage, setCurrentPage] = useState(1);
    const [formData, setFormData] = useState<ClinicalHistoryData>(defaultFormData);
    const [evaluationType, setEvaluationType] = useState('VALORACION_INICIAL');
    const [historyId, setHistoryId] = useState<string | undefined>(initialHistory?.id);
    const [isLoading, setIsLoading] = useState(false);
    // Firmas oficiales selladas provenientes de la base de datos
    const [sealedSignatures, setSealedSignatures] = useState<{ patient?: string; physio?: string }>({});
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        if (initialHistory) {
            try {
                const parsed = JSON.parse(initialHistory.formDataJson);
                setFormData({ ...defaultFormData, ...parsed });
                setEvaluationType(initialHistory.evaluationType || 'VALORACION_INICIAL');
                setHistoryId(initialHistory.id);
                // Si la historia ya tiene firmas guardadas, las sellamos
                setSealedSignatures({
                    patient: parsed.comprehensivePlan?.patientSignature || '',
                    physio: parsed.comprehensivePlan?.physioSignature || '',
                });
            } catch (err) {
                console.error('Error parseando historia clínica', err);
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                patientName: patientUsername,
                therapistName: user?.username || 'Fisioterapeuta',
            }));
        }
    }, [initialHistory, patientUsername, user?.username]);

    // Autocálculo de IMC
    const handleWeightHeightChange = (weightStr: string, heightStr: string) => {
        let calculatedBmi = '';
        const w = parseFloat(weightStr);
        let h = parseFloat(heightStr);

        if (w > 0 && h > 0) {
            if (h > 3) h = h / 100;
            const bmiVal = (w / (h * h)).toFixed(1);
            calculatedBmi = bmiVal;
        }

        setFormData((prev) => ({
            ...prev,
            weight: weightStr,
            height: heightStr,
            bmi: calculatedBmi,
        }));
    };

    // Autocálculo de Edad
    const handleBirthDateChange = (bDate: string) => {
        let calculatedAge = '';
        if (bDate) {
            const birth = new Date(bDate);
            const today = new Date();
            let ageVal = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                ageVal--;
            }
            if (ageVal >= 0) calculatedAge = String(ageVal);
        }

        setFormData((prev) => ({
            ...prev,
            birthDate: bDate,
            age: calculatedAge || prev.age,
        }));
    };

    // Lógica del Lienzo Táctil de Firma (con compensación de escala exacta para evitar desfases)
    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e && e.touches.length > 0) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        const mouseEv = e as React.MouseEvent<HTMLCanvasElement>;
        return {
            x: (mouseEv.clientX - rect.left) * scaleX,
            y: (mouseEv.clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = e.currentTarget;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const coords = getCoordinates(e, canvas);

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0f172a';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = e.currentTarget;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const coords = getCoordinates(e, canvas);

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
    };

    const stopDrawing = (canvas: HTMLCanvasElement, target: 'patient' | 'physio' = 'patient') => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const dataUrl = canvas.toDataURL('image/png');
        setFormData((prev) => ({
            ...prev,
            comprehensivePlan: {
                ...prev.comprehensivePlan,
                ...(target === 'patient' ? { patientSignature: dataUrl } : { physioSignature: dataUrl }),
            },
        }));
    };

    const clearSignature = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setFormData((prev) => ({
            ...prev,
            comprehensivePlan: {
                ...prev.comprehensivePlan,
                patientSignature: '',
            },
        }));
    };

    const handleSave = async (asNewEvaluation: boolean = false) => {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsLoading(true);

        try {
            const targetType = asNewEvaluation ? 'REEVALUACION_PROGRESO' : evaluationType;
            await clinicalHistoryService.save({
                id: asNewEvaluation ? undefined : historyId,
                patientId,
                evaluationType: targetType,
                mainDiagnosis: formData.comprehensivePlan.medicalDiagnosis || formData.consultationReason || 'Fisioterapia General',
                painLevel: formData.painScale,
                formDataJson: JSON.stringify(formData),
            });

            setSuccessMsg(asNewEvaluation ? 'Nueva Reevaluación guardada en el expediente.' : 'Historia Clínica guardada exitosamente.');
            onSaved?.(); // Ejecutar el callback de guardado para la vista padre
            // Cierre automático suave después de mostrar la confirmación
            setTimeout(() => {
                onClose();
            }, 1200);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Error al guardar la Historia Clínica.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const pages = [
        { num: 1, title: 'Anamnesis & Dolor' },
        { num: 2, title: 'Fuerza & SOAP' },
        { num: 3, title: 'Arcos Sup.' },
        { num: 4, title: 'Arcos Inf.' },
        { num: 5, title: 'Mapa Corporal' },
        { num: 6, title: 'Postura & Marcha' },
        { num: 7, title: 'Plan, CIE & Firma' },
    ];

    return (
        <>
            {/* 1. VISTA INTERACTIVA PANTALLA (MODAL) */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print print:hidden">
                <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] sm:h-[88vh] shadow-2xl border border-slate-200 flex flex-col mb-14 sm:mb-0 overflow-hidden">

                    {/* Header Superior */}
                    <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">
                                    {isPatient ? 'Mi Expediente' : 'Historia Clínica'}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {evaluationType}
                                </span>
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 truncate">
                                Paciente: {formData.patientName || patientUsername}
                            </h2>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs px-2.5 sm:px-3"
                                onClick={handlePrint}
                                leftIcon={<Printer className="w-3.5 h-3.5" />}
                            >
                                Imprimir / PDF
                            </Button>

                            {!isPatient && (
                                <div className="flex items-center gap-1.5">
                                    {historyId && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs px-2.5 sm:px-3 text-teal-700 border-teal-300 hover:bg-teal-50"
                                            onClick={() => handleSave(true)}
                                            isLoading={isLoading}
                                            title="Crea una nueva evaluación de seguimiento sin modificar el registro sellado anterior"
                                        >
                                            Guardar como Nueva Reevaluación
                                        </Button>
                                    )}
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="text-xs px-3 sm:px-4"
                                        onClick={() => handleSave(false)}
                                        isLoading={isLoading}
                                        leftIcon={<Save className="w-3.5 h-3.5" />}
                                    >
                                        {historyId ? 'Actualizar' : 'Guardar'}
                                    </Button>
                                </div>
                            )}

                            <button
                                onClick={onClose}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Mensajes de feedback */}
                    {successMsg && (
                        <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-sm text-emerald-800 shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-sm text-rose-800 shrink-0">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Barra de 7 Pestañas Táctiles */}
                    <div className="px-4 sm:px-6 py-2 bg-slate-50 border-b border-slate-200/80 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-thin">
                        {pages.map((p) => (
                            <button
                                key={p.num}
                                onClick={() => setCurrentPage(p.num)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${currentPage === p.num
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${currentPage === p.num ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {p.num}
                                </span>
                                <span>{p.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Contenido de la Página Activa */}
                    <div className="p-6 overflow-y-auto flex-1 space-y-6">

                        {/* PÁGINA 1 */}
                        {currentPage === 1 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/40 p-5 rounded-2xl border border-teal-100">
                                    <h3 className="text-xs font-extrabold text-teal-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-teal-600" /> Datos Demográficos y Personales
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <Input label="Nombre Completo" value={formData.patientName} disabled={isPatient} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} />
                                        <Input label="Fecha de Nacimiento" type="date" value={formData.birthDate} disabled={isPatient} onChange={(e) => handleBirthDateChange(e.target.value)} />
                                        <Input label="Edad (Años)" value={formData.age} disabled={isPatient} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                                        <Input label="CURP / ID Oficial" value={formData.curp} disabled={isPatient} placeholder="ej. ABCD010101..." onChange={(e) => setFormData({ ...formData, curp: e.target.value })} />
                                        <Input label="Teléfono Móvil" value={formData.phone} disabled={isPatient} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                        <Input label="Ocupación" value={formData.occupation} disabled={isPatient} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
                                        <Input label="Contacto Emergencia" value={formData.emergencyContactName} disabled={isPatient} placeholder="Familiar / Tutor" leftIcon={<PhoneCall className="w-4 h-4 text-rose-500" />} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} />
                                        <Input label="Teléfono Emergencia" value={formData.emergencyContactPhone} disabled={isPatient} placeholder="Teléfono" onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} />
                                    </div>
                                </div>

                                {/* Somatometría & Signos Vitales */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                                            <Activity className="w-4 h-4 text-teal-600" /> Somatometría (IMC Automático)
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <Input label="Peso (kg)" value={formData.weight} disabled={isPatient} placeholder="e.j. 70 o N/A" onChange={(e) => handleWeightHeightChange(e.target.value, formData.height)} />
                                            <Input label="Talla (cm/m)" value={formData.height} disabled={isPatient} placeholder="e.j. 1.70 o N/A" onChange={(e) => handleWeightHeightChange(formData.weight, e.target.value)} />
                                            <Input label="IMC (Auto)" value={formData.bmi || 'N/A'} disabled />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
                                            <HeartPulse className="w-4 h-4 text-teal-600" /> Signos Vitales (o N/A)
                                        </h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                            <Input label="T/A" value={formData.vitals.bp} disabled={isPatient} placeholder="120/80 o N/A" onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bp: e.target.value } })} />
                                            <Input label="Temp °C" value={formData.vitals.temp} disabled={isPatient} placeholder="36.5 o N/A" onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temp: e.target.value } })} />
                                            <Input label="FC (lpm)" value={formData.vitals.hr} disabled={isPatient} placeholder="72 o N/A" onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, hr: e.target.value } })} />
                                            <Input label="FR (rpm)" value={formData.vitals.rr} disabled={isPatient} placeholder="18 o N/A" onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, rr: e.target.value } })} />

                                            <div className="relative">
                                                <Input label="SpO2 (%)" value={formData.vitals.spo2} disabled={isPatient} placeholder="98% o N/A" onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: e.target.value } })} />
                                                {!isPatient && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, vitals: { ...formData.vitals, spo2: 'N/A' } })}
                                                        className="absolute right-1 top-6 text-[10px] bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 rounded font-bold text-slate-700"
                                                    >
                                                        N/A
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Medicación & Motivo */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1.5">
                                            <Pill className="w-4 h-4 text-teal-600" /> Medicación Actual / Fármacos (o N/A)
                                        </label>
                                        <textarea rows={2} disabled={isPatient} value={formData.currentMedication} onChange={(e) => setFormData({ ...formData, currentMedication: e.target.value })} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Medicamentos o N/A..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motivo de Consulta</label>
                                        <textarea rows={2} disabled={isPatient} value={formData.consultationReason} onChange={(e) => setFormData({ ...formData, consultationReason: e.target.value })} className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm" placeholder="Motivo de la sesión..." />
                                    </div>
                                </div>

                                {/* Escala Visual Análoga del Dolor (EVA) con Imagen de Caritas */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase">Escala del Dolor (EVA 0 - 10)</h4>
                                        <span className="text-sm font-extrabold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                                            Nivel Seleccionado: {formData.painScale} / 10
                                        </span>
                                    </div>

                                    {/* Imagen oficial de caritas del dolor extendida */}
                                    <div className="bg-white p-3 rounded-2xl border border-slate-200 flex justify-center shadow-xs overflow-hidden">
                                        <img
                                            src="/eva-faces.jpg"
                                            alt="Escala visual analógica del dolor"
                                            className="w-full max-w-2xl h-auto max-h-36 sm:max-h-44 object-contain rounded-xl"
                                        />
                                    </div>

                                    {/* Selector interactivo de botones 0 - 10 */}
                                    <div className="grid grid-cols-11 gap-1 pt-1">
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                disabled={isPatient}
                                                onClick={() => setFormData({ ...formData, painScale: num })}
                                                className={`h-10 rounded-xl font-bold text-sm transition ${formData.painScale === num
                                                    ? 'bg-teal-600 text-white ring-2 ring-teal-400 shadow-sm'
                                                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-teal-50'
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PÁGINA 2 */}
                        {currentPage === 2 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase">Página 2: Fuerza Muscular (Daniels 0-5) & SOAP</h3>
                                </div>
                                <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Segmento</th>
                                                <th className="p-3 text-center" colSpan={2}>Evaluación 1 (Izq / Der)</th>
                                                <th className="p-3 text-center" colSpan={2}>Evaluación 2 (Izq / Der)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {['ms', 'mi', 'trunk', 'neck'].map((key) => {
                                                const labels: Record<string, string> = { ms: 'Miembros Sup.', mi: 'Miembros Inf.', trunk: 'Tronco', neck: 'Cuello' };
                                                const row = formData.muscleEvaluation[key as keyof typeof formData.muscleEvaluation];
                                                return (
                                                    <tr key={key}>
                                                        <td className="p-3 font-semibold text-slate-800">{labels[key]}</td>
                                                        <td className="p-2"><input disabled={isPatient} value={row.eval1L} onChange={(e) => setFormData({ ...formData, muscleEvaluation: { ...formData.muscleEvaluation, [key]: { ...row, eval1L: e.target.value } } })} className="w-16 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg" placeholder="Izq" /></td>
                                                        <td className="p-2"><input disabled={isPatient} value={row.eval1R} onChange={(e) => setFormData({ ...formData, muscleEvaluation: { ...formData.muscleEvaluation, [key]: { ...row, eval1R: e.target.value } } })} className="w-16 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg" placeholder="Der" /></td>
                                                        <td className="p-2"><input disabled={isPatient} value={row.eval2L} onChange={(e) => setFormData({ ...formData, muscleEvaluation: { ...formData.muscleEvaluation, [key]: { ...row, eval2L: e.target.value } } })} className="w-16 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg" placeholder="Izq" /></td>
                                                        <td className="p-2"><input disabled={isPatient} value={row.eval2R} onChange={(e) => setFormData({ ...formData, muscleEvaluation: { ...formData.muscleEvaluation, [key]: { ...row, eval2R: e.target.value } } })} className="w-16 h-10 text-center bg-slate-50 border border-slate-200 rounded-lg" placeholder="Der" /></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PÁGINA 3 */}
                        {currentPage === 3 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase">Página 3: Arcos de Movilidad - Miembros Superiores</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 text-sm">Hombro</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Flexión (°)" value={formData.upperLimbs.shoulder.flexion} disabled={isPatient} placeholder="180 o N/A" onChange={(e) => setFormData({ ...formData, upperLimbs: { ...formData.upperLimbs, shoulder: { ...formData.upperLimbs.shoulder, flexion: e.target.value } } })} />
                                            <Input label="Extensión (°)" value={formData.upperLimbs.shoulder.extension} disabled={isPatient} placeholder="50 o N/A" onChange={(e) => setFormData({ ...formData, upperLimbs: { ...formData.upperLimbs, shoulder: { ...formData.upperLimbs.shoulder, extension: e.target.value } } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PÁGINA 4 */}
                        {currentPage === 4 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase">Página 4: Arcos de Movilidad - Miembros Inferiores</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 text-sm">Cadera & Rodilla</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Flexión Cadera" value={formData.lowerLimbs.hip.flexExtKnee} disabled={isPatient} placeholder="120 o N/A" onChange={(e) => setFormData({ ...formData, lowerLimbs: { ...formData.lowerLimbs, hip: { ...formData.lowerLimbs.hip, flexExtKnee: e.target.value } } })} />
                                            <Input label="Flexión Rodilla" value={formData.lowerLimbs.knee.kneeFlex} disabled={isPatient} placeholder="135 o N/A" onChange={(e) => setFormData({ ...formData, lowerLimbs: { ...formData.lowerLimbs, knee: { ...formData.lowerLimbs.knee, kneeFlex: e.target.value } } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PÁGINA 5: MAPA ANATÓMICO DE DOLOR & MARCHA */}
                        {currentPage === 5 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-teal-900 uppercase">Página 5: Mapa Corporal de Dolor y Análisis Funcional</h3>
                                        <p className="text-xs text-teal-700">Haz clic sobre el cuerpo humano para señalar los puntos donde el paciente refiere dolor o lesión.</p>
                                    </div>
                                    {((formData as any).painPoints || []).length > 0 && !isPatient && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, ...({ painPoints: [] } as any) })}
                                            className="text-xs text-rose-600 font-bold hover:underline bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs"
                                        >
                                            Limpiar Puntos
                                        </button>
                                    )}
                                </div>

                                {/* Lienzo Interactivo con Silueta Anatómica Frontal y Dorsal */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
                                    <div
                                        className="relative bg-white border border-slate-300 rounded-2xl p-2 shadow-inner cursor-crosshair select-none"
                                        onClick={(e) => {
                                            if (isPatient) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                                            const y = ((e.clientY - rect.top) / rect.height) * 100;
                                            const currentPoints = (formData as any).painPoints || [];
                                            setFormData({
                                                ...formData,
                                                ...({ painPoints: [...currentPoints, { x: x.toFixed(1), y: y.toFixed(1) }] } as any)
                                            });
                                        }}
                                    >
                                        <img
                                            src="/body-map.png"
                                            alt="Mapa Corporal"
                                            className="h-[360px] sm:h-[420px] object-contain pointer-events-none"
                                        />

                                        {/* Puntos rojos de dolor marcados */}
                                        {((formData as any).painPoints || []).map((pt: any, idx: number) => (
                                            <div
                                                key={idx}
                                                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                                                className="absolute w-4 h-4 -ml-2 -mt-2 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-md animate-pulse ring-2 ring-white"
                                                title={`Punto de dolor #${idx + 1}`}
                                            >
                                                {idx + 1}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-medium">
                                        💡 Clic en la figura para colocar puntos de dolor numerados (Anterior y Posterior).
                                    </p>
                                </div>

                            </div>
                        )}

                        {/* PÁGINA 6: EVALUACIÓN POSTURAL & ANÁLISIS DE LA MARCHA */}
                        {currentPage === 6 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase">Página 6: Evaluación Postural & Análisis de Marcha</h3>
                                    <p className="text-xs text-teal-700">Exploración estática en los tres planos y dinámica del paso.</p>
                                </div>

                                {/* Tres Vistas Posturales con fondos limpios y claros */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 text-sm">Vista Anterior (Frontal)</h4>
                                        <textarea
                                            rows={5}
                                            disabled={isPatient}
                                            value={typeof (formData.posturalEvaluation as any)?.frontal === 'string' ? (formData.posturalEvaluation as any).frontal : ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                posturalEvaluation: { ...formData.posturalEvaluation, frontal: e.target.value as any }
                                            })}
                                            placeholder="Alineación cefálica, altura de hombros, nivel pélvico, rodillas y pies..."
                                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 text-sm">Vista Lateral (Sagital)</h4>
                                        <textarea
                                            rows={5}
                                            disabled={isPatient}
                                            value={typeof (formData.posturalEvaluation as any)?.lateral === 'string' ? (formData.posturalEvaluation as any).lateral : ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                posturalEvaluation: { ...formData.posturalEvaluation, lateral: e.target.value as any }
                                            })}
                                            placeholder="Línea de plomada, curvaturas cervical/dorsal/lumbar, anteversión..."
                                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                        <h4 className="font-bold text-slate-900 text-sm">Vista Posterior</h4>
                                        <textarea
                                            rows={5}
                                            disabled={isPatient}
                                            value={typeof (formData.posturalEvaluation as any)?.posterior === 'string' ? (formData.posturalEvaluation as any).posterior : ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                posturalEvaluation: { ...formData.posturalEvaluation, posterior: e.target.value as any }
                                            })}
                                            placeholder="Línea de apófisis, posición escapular, tendones aquileos, pliegues..."
                                            className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Análisis de Marcha ubicado en la misma página */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Inicio y Patrón de la Marcha</label>
                                    <select
                                        disabled={isPatient}
                                        value={formData.gaitAnalysis.initialStep}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            gaitAnalysis: { ...formData.gaitAnalysis, initialStep: e.target.value }
                                        })}
                                        className="w-full h-11 bg-white border border-slate-300 rounded-xl px-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                    >
                                        <option value="No vacilante">No vacilante (Marcha Fluida y Normal)</option>
                                        <option value="Duda o vacila">Duda o vacila (Claudicante o Insegura)</option>
                                        <option value="Con apoyo / Asistencia">Con apoyo / Asistencia (Muletas, Bastón, Andadera)</option>
                                        <option value="N/A">N/A (No Evaluado / Paciente en camilla)</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* PÁGINA 7 */}
                        {currentPage === 7 && (
                            <div className="space-y-6">
                                <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
                                    <h3 className="text-sm font-bold text-teal-900 uppercase">Página 7: Diagnóstico CIF / CIE-10 & Firma Legal</h3>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <Input
                                            label="Diagnóstico Fisioterapéutico"
                                            value={formData.comprehensivePlan.medicalDiagnosis}
                                            disabled={isPatient}
                                            placeholder="ej. Lumbalgia mecánica, Esguince de tobillo..."
                                            onChange={(e) => setFormData({ ...formData, comprehensivePlan: { ...formData.comprehensivePlan, medicalDiagnosis: e.target.value } })}
                                        />
                                        <div>
                                            <Input
                                                label="Código CIE-10 / CIE-11"
                                                list="cie10-options"
                                                value={formData.comprehensivePlan.cieCode}
                                                disabled={isPatient}
                                                placeholder="Selecciona o escribe (ej. M54.5)"
                                                onChange={(e) => setFormData({ ...formData, comprehensivePlan: { ...formData.comprehensivePlan, cieCode: e.target.value } })}
                                            />
                                            <datalist id="cie10-options">
                                                <option value="M54.5 - Lumbalgia no especificada" />
                                                <option value="M54.2 - Cervicalgia" />
                                                <option value="M75.1 - Síndrome del manguito rotador" />
                                                <option value="M77.1 - Epicondilitis lateral (codo de tenista)" />
                                                <option value="S93.4 - Esguince de tobillo" />
                                                <option value="S83.5 - Esguince / lesión de ligamento cruzado de rodilla" />
                                                <option value="M17.0 - Gonartrosis primaria bilateral" />
                                                <option value="M72.2 - Fascitis plantar" />
                                                <option value="G51.0 - Parálisis facial de Bell" />
                                                <option value="M62.8 - Espasmo / contractura muscular" />
                                                <option value="N/A - No Aplica / En Estudio" />
                                            </datalist>
                                        </div>
                                        <div>
                                            <Input
                                                label="Código CIF (Funcionalidad)"
                                                list="cif-options"
                                                value={formData.comprehensivePlan.cifCode}
                                                disabled={isPatient}
                                                placeholder="Selecciona o escribe (ej. b280)"
                                                onChange={(e) => setFormData({ ...formData, comprehensivePlan: { ...formData.comprehensivePlan, cifCode: e.target.value } })}
                                            />
                                            <datalist id="cif-options">
                                                <option value="b28013 - Dolor de espalda / columna" />
                                                <option value="b28016 - Dolor en articulaciones o miembros" />
                                                <option value="b7100 - Movilidad de una sola articulación" />
                                                <option value="b730 - Funciones de fuerza muscular" />
                                                <option value="d450 - Andar / Marcha y deambulación" />
                                                <option value="d410 - Cambiar las posturas corporales básicas" />
                                                <option value="d455 - Desplazarse por el entorno / escaleras" />
                                                <option value="s760 - Estructura del tronco / columna" />
                                                <option value="s750 - Estructura del miembro inferior" />
                                                <option value="s730 - Estructura de la extremidad superior" />
                                                <option value="N/A - No Aplica / En Estudio" />
                                            </datalist>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 italic">
                                        💡 Tip: Puedes desplegar la lista para elegir los códigos más habituales o escribir tu propio código personalizado.
                                    </p>
                                </div>

                                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                                    <h4 className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600" /> Validación Legal y Consentimiento Informado
                                    </h4>
                                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 font-medium">
                                        <input type="checkbox" disabled={isPatient} checked={formData.comprehensivePlan.informedConsentAccepted} onChange={(e) => setFormData({ ...formData, comprehensivePlan: { ...formData.comprehensivePlan, informedConsentAccepted: e.target.checked } })} className="w-4 h-4 mt-0.5 rounded text-teal-600 focus:ring-teal-500 cursor-pointer" />
                                        <span><strong>Consentimiento Informado Aceptado:</strong> El paciente/tutor autoriza la intervención física de fisioterapia.</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                                        <Input label="Fisioterapeuta Responsable" value={formData.therapistName} disabled={isPatient} onChange={(e) => setFormData({ ...formData, therapistName: e.target.value })} />
                                        <Input label="Cédula Profesional" value={formData.comprehensivePlan.physioLicense} disabled={isPatient} placeholder="ej. CED-PRO-1234567" onChange={(e) => setFormData({ ...formData, comprehensivePlan: { ...formData.comprehensivePlan, physioLicense: e.target.value } })} />
                                    </div>
                                </div>

                                {/* Lienzos de Doble Firma Digital: Paciente y Fisioterapeuta */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 1. Firma Paciente */}
                                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase">
                                                Firma Paciente / Tutor
                                            </label>
                                            {sealedSignatures.patient ? (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                                    🔒 Firma Sellada y Verificada
                                                </span>
                                            ) : formData.comprehensivePlan.patientSignature ? (
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                                    ✓ Por Guardar
                                                </span>
                                            ) : null}
                                        </div>

                                        {sealedSignatures.patient ? (
                                            /* Firma del paciente protegida e inmutable sobre fondo blanco clínico */
                                            <div className="border border-slate-200 rounded-xl bg-white! flex flex-col justify-center items-center p-3 h-28 shadow-inner">
                                                <img src={sealedSignatures.patient} alt="Firma Oficial Paciente" className="max-h-20 object-contain" />
                                                <span className="text-[10px] text-slate-500 font-medium">Registro legal inmutable.</span>
                                            </div>
                                        ) : (
                                            /* Si es nueva, permitimos dibujar y borrar */
                                            <>
                                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white! flex justify-center items-center overflow-hidden shadow-inner">
                                                    <canvas
                                                        width={450}
                                                        height={120}
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={(e) => stopDrawing(e.currentTarget)}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={(e) => stopDrawing(e.currentTarget)}
                                                        className="cursor-crosshair touch-none w-full h-28 bg-white!"
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            const container = e.currentTarget.closest('.space-y-2');
                                                            const canvas = container?.querySelector('canvas');
                                                            if (canvas) clearSignature(canvas);
                                                        }}
                                                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                                    >
                                                        Borrar firma
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* 2. Firma Fisioterapeuta Responsable */}
                                    <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-700 uppercase">
                                                Firma del Fisioterapeuta
                                            </label>
                                            {sealedSignatures.physio ? (
                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                                    🔒 Firma Sellada y Verificada
                                                </span>
                                            ) : formData.comprehensivePlan.physioSignature ? (
                                                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                                    ✓ Por Guardar
                                                </span>
                                            ) : null}
                                        </div>

                                        {sealedSignatures.physio ? (
                                            /* Firma del fisio protegida e inmutable sobre fondo blanco clínico */
                                            <div className="border border-slate-200 rounded-xl bg-white! flex flex-col justify-center items-center p-3 h-28 shadow-inner">
                                                <img src={sealedSignatures.physio} alt="Firma Oficial Fisioterapeuta" className="max-h-20 object-contain" />
                                                <span className="text-[10px] text-slate-500 font-medium">Registro profesional inmutable.</span>
                                            </div>
                                        ) : (
                                            /* Si es nuevo registro, permitimos dibujar */
                                            <>
                                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white! flex justify-center items-center overflow-hidden shadow-inner">
                                                    <canvas
                                                        width={450}
                                                        height={120}
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={(e) => stopDrawing(e.currentTarget, 'physio')}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={(e) => stopDrawing(e.currentTarget, 'physio')}
                                                        className="cursor-crosshair touch-none w-full h-28 bg-white!"
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            const container = e.currentTarget.closest('.space-y-2');
                                                            const canvas = container?.querySelector('canvas');
                                                            if (canvas) {
                                                                clearSignature(canvas);
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    comprehensivePlan: { ...prev.comprehensivePlan, physioSignature: '' }
                                                                }));
                                                            }
                                                        }}
                                                        className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                                    >
                                                        Borrar firma
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                    {/* Footer Navegación */}
                    <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} leftIcon={<ChevronLeft className="w-4 h-4" />}>Anterior</Button>
                        <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200">Página {currentPage} de {pages.length}</span>
                        <Button variant="primary" size="sm" disabled={currentPage === pages.length} onClick={() => setCurrentPage((prev) => Math.min(pages.length, prev + 1))} rightIcon={<ChevronRight className="w-4 h-4" />}>Siguiente</Button>
                    </div>

                </div>
            </div>

            {/* 2. VISTA DE IMPRESIÓN OFICIAL DE LAS 7 PÁGINAS (EXCLUSIVA PARA PDF / IMPRESIÓN) */}
            <div id="clinical-history-print" className="hidden print:block print-document font-sans text-slate-900">

                {/* ENCABEZADO MÉDICO GENERAL EN CADA HOJA (NEUTRO CLÍNICO) */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">FisioApp - Expediente Clínico</h1>
                        <p className="text-[11px] font-semibold text-slate-600">Historia Clínica Fisioterapéutica & Valoración Biomecánica</p>
                    </div>
                    <div className="text-right text-[11px]">
                        <p className="font-bold text-slate-900">Fecha: {formData.evaluationDate}</p>
                        <p className="text-slate-600">Expediente #: {formData.recordNumber || 'EXP-001'}</p>
                        <p className="font-mono text-slate-900 font-bold">{evaluationType}</p>
                    </div>
                </div>

                {/* HOJA 1 IMPRESA */}
                <div className="print-break space-y-4 mb-6">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">HOJA 1: ANAMNESIS & DATOS GENERALES</h2>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div><strong>Paciente:</strong> {formData.patientName}</div>
                        <div><strong>Fecha Nacimiento:</strong> {formData.birthDate || 'N/A'} ({formData.age} años)</div>
                        <div><strong>CURP / ID:</strong> {formData.curp || 'N/A'}</div>
                        <div><strong>Teléfono:</strong> {formData.phone || 'N/A'}</div>
                        <div><strong>Contacto Emergencia:</strong> {formData.emergencyContactName || 'N/A'} ({formData.emergencyContactPhone || 'N/A'})</div>
                        <div><strong>Ocupación:</strong> {formData.occupation || 'N/A'}</div>
                    </div>

                    <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pt-2">Somatometría & Signos Vitales</h3>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div><strong>Peso:</strong> {formData.weight || 'N/A'} kg</div>
                        <div><strong>Talla:</strong> {formData.height || 'N/A'}</div>
                        <div><strong>IMC:</strong> {formData.bmi || 'N/A'}</div>
                        <div><strong>Presión T/A:</strong> {formData.vitals.bp || 'N/A'}</div>
                        <div><strong>Temp:</strong> {formData.vitals.temp || 'N/A'} °C</div>
                        <div><strong>FC:</strong> {formData.vitals.hr || 'N/A'} lpm</div>
                        <div><strong>FR:</strong> {formData.vitals.rr || 'N/A'} rpm</div>
                        <div><strong>SpO2:</strong> {formData.vitals.spo2 || 'N/A'}</div>
                    </div>

                    <div className="text-xs space-y-2 pt-2">
                        <div><strong>Medicación Actual:</strong> {formData.currentMedication || 'Ninguna / N/A'}</div>
                        <div><strong>Motivo de Consulta:</strong> {formData.consultationReason || 'N/A'}</div>
                        <div className="pt-2 border-t border-slate-200">
                            <strong>Escala Visual Análoga del Dolor (EVA): {formData.painScale} / 10</strong>
                            <div className="mt-1 border border-slate-300 p-2 rounded bg-white flex flex-col items-center">
                                <img src="/eva-faces.jpg" alt="Escala de dolor" className="max-h-24 object-contain" />
                                <div className="text-[10px] font-bold text-slate-700 mt-1">
                                    Nivel manifestado por el paciente al momento de la valoración: <span className="underline font-black text-black">{formData.painScale} de 10</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HOJA 2 IMPRESA */}
                <div className="print-break space-y-4 mb-6 pt-4">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">HOJA 2: EVALUACIÓN MUSCULAR (DANIELS 0-5) & SOAP</h2>
                    <table className="w-full text-xs border border-slate-300 border-collapse">
                        <thead>
                            <tr className="bg-slate-100 border-b border-slate-300">
                                <th className="p-2 border">Segmento</th>
                                <th className="p-2 border">Eval 1 (Izq / Der)</th>
                                <th className="p-2 border">Eval 2 (Izq / Der)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="p-2 border font-bold">Miembros Superiores</td><td className="p-2 border text-center">{formData.muscleEvaluation.ms.eval1L} / {formData.muscleEvaluation.ms.eval1R}</td><td className="p-2 border text-center">{formData.muscleEvaluation.ms.eval2L} / {formData.muscleEvaluation.ms.eval2R}</td></tr>
                            <tr><td className="p-2 border font-bold">Miembros Inferiores</td><td className="p-2 border text-center">{formData.muscleEvaluation.mi.eval1L} / {formData.muscleEvaluation.mi.eval1R}</td><td className="p-2 border text-center">{formData.muscleEvaluation.mi.eval2L} / {formData.muscleEvaluation.mi.eval2R}</td></tr>
                            <tr><td className="p-2 border font-bold">Tronco</td><td className="p-2 border text-center">{formData.muscleEvaluation.trunk.eval1L} / {formData.muscleEvaluation.trunk.eval1R}</td><td className="p-2 border text-center">{formData.muscleEvaluation.trunk.eval2L} / {formData.muscleEvaluation.trunk.eval2R}</td></tr>
                            <tr><td className="p-2 border font-bold">Cuello</td><td className="p-2 border text-center">{formData.muscleEvaluation.neck.eval1L} / {formData.muscleEvaluation.neck.eval1R}</td><td className="p-2 border text-center">{formData.muscleEvaluation.neck.eval2L} / {formData.muscleEvaluation.neck.eval2R}</td></tr>
                        </tbody>
                    </table>

                    <div className="text-xs space-y-2 pt-2">
                        <p><strong>S (Subjetivo):</strong> {formData.initialSoap.subjective || 'N/A'}</p>
                        <p><strong>O (Objetivo):</strong> {formData.initialSoap.objective || 'N/A'}</p>
                        <p><strong>A (Análisis):</strong> {formData.initialSoap.analysis || 'N/A'}</p>
                        <p><strong>P (Plan):</strong> {formData.initialSoap.plan || 'N/A'}</p>
                    </div>
                </div>

                {/* HOJA 3 IMPRESA */}
                <div className="print-break space-y-4 mb-6 pt-4">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">HOJA 3: ARCOS DE MOVILIDAD - MIEMBROS SUPERIORES</h2>
                    <div className="p-3 border rounded text-xs space-y-2">
                        <h3 className="font-bold border-b pb-1">Hombro, Codo y Muñeca</h3>
                        <p>Flexión Hombro: {formData.upperLimbs.shoulder.flexion}° | Extensión: {formData.upperLimbs.shoulder.extension}°</p>
                        <p>ABD Hombro: {formData.upperLimbs.shoulder.abd}° | ADD: {formData.upperLimbs.shoulder.add}°</p>
                        <p>Flexión Codo: {formData.upperLimbs.elbow.flexion}° | Supinación: {formData.upperLimbs.forearm.supination}°</p>
                    </div>
                </div>

                {/* HOJA 4 IMPRESA */}
                <div className="print-break space-y-4 mb-6 pt-4">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">HOJA 4: ARCOS DE MOVILIDAD - MIEMBROS INFERIORES</h2>
                    <div className="p-3 border rounded text-xs space-y-2">
                        <h3 className="font-bold border-b pb-1">Cadera, Rodilla y Tobillo</h3>
                        <p>Flexión Cadera: {formData.lowerLimbs.hip.flexExtKnee}° | Extensión: {formData.lowerLimbs.hip.hipExt}°</p>
                        <p>Flexión Rodilla: {formData.lowerLimbs.knee.kneeFlex}° | Extensión: {formData.lowerLimbs.knee.kneeExt}°</p>
                        <p>Plantiflexión Tobillo: {formData.lowerLimbs.ankle.plantFlex}° | Dorsiflexión: {formData.lowerLimbs.ankle.dorsiFlex}°</p>
                    </div>
                </div>

                {/* HOJA 5 IMPRESA: MAPA CORPORAL DE DOLOR */}
                <div className="print-break space-y-3 mb-6 pt-4">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">
                        HOJA 5: MAPA CORPORAL Y TOPOGRAFÍA DEL DOLOR
                    </h2>
                    <div className="border border-slate-300 p-3 rounded flex flex-col items-center bg-white">
                        <div className="relative inline-block border border-slate-200 p-2 rounded">
                            <img src="/body-map.png" alt="Mapa Corporal" className="h-[380px] object-contain" />
                            {((formData as any).painPoints || []).map((pt: any, idx: number) => (
                                <div
                                    key={idx}
                                    style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                                    className="absolute w-4 h-4 -ml-2 -mt-2 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black border border-white"
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-2 italic">
                            Puntos dolorosos registrados: {((formData as any).painPoints || []).length > 0 ? `${((formData as any).painPoints || []).length} zona(s) señalada(s)` : 'Sin puntos específicos marcados'}
                        </p>
                    </div>
                </div>

                {/* HOJA 6 IMPRESA: EVALUACIÓN POSTURAL & MARCHA */}
                <div className="print-break space-y-4 mb-6 pt-4">
                    <h2 className="text-xs font-black bg-slate-100 text-black border border-slate-400 px-3 py-1.5 rounded uppercase tracking-wider">
                        HOJA 6: EVALUACIÓN POSTURAL & ANÁLISIS DE MARCHA
                    </h2>
                    <div className="grid grid-cols-1 gap-3 text-xs">
                        <div className="p-3 border border-slate-400 rounded-lg space-y-1 bg-white">
                            <strong className="block border-b border-slate-300 pb-1">Vista Anterior (Frontal):</strong>
                            <p className="whitespace-pre-line text-black">
                                {typeof (formData.posturalEvaluation as any)?.frontal === 'string' && (formData.posturalEvaluation as any).frontal.trim()
                                    ? (formData.posturalEvaluation as any).frontal
                                    : 'No evaluada / Sin alteraciones observadas.'}
                            </p>
                        </div>
                        <div className="p-3 border border-slate-400 rounded-lg space-y-1 bg-white">
                            <strong className="block border-b border-slate-300 pb-1">Vista Lateral (Sagital):</strong>
                            <p className="whitespace-pre-line text-black">
                                {typeof (formData.posturalEvaluation as any)?.lateral === 'string' && (formData.posturalEvaluation as any).lateral.trim()
                                    ? (formData.posturalEvaluation as any).lateral
                                    : 'No evaluada / Sin alteraciones observadas.'}
                            </p>
                        </div>
                        <div className="p-3 border border-slate-400 rounded-lg space-y-1 bg-white">
                            <strong className="block border-b border-slate-300 pb-1">Vista Posterior:</strong>
                            <p className="whitespace-pre-line text-black">
                                {typeof (formData.posturalEvaluation as any)?.posterior === 'string' && (formData.posturalEvaluation as any).posterior.trim()
                                    ? (formData.posturalEvaluation as any).posterior
                                    : 'No evaluada / Sin alteraciones observadas.'}
                            </p>
                        </div>

                        {/* Sección de Marcha en la misma Hoja 6 impresa */}
                        <div className="p-3 border border-slate-400 rounded-lg space-y-1 bg-slate-50">
                            <strong className="block border-b border-slate-300 pb-1">Análisis Observacional de la Marcha:</strong>
                            <p className="text-black">
                                <strong>Inicio y Patrón:</strong> {formData.gaitAnalysis.initialStep || 'No evaluado'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* HOJA 7 IMPRESA */}
                <div className="pt-4 space-y-4">
                    <h2 className="text-xs font-black bg-slate-100 text-slate-900 border border-slate-300 px-3 py-1.5 rounded uppercase tracking-wider">HOJA 7: DIAGNÓSTICO CIF / CIE-10 & FIRMAS LEGALES</h2>
                    <div className="text-xs space-y-2 border p-3 rounded">
                        <p><strong>Diagnóstico Fisioterapéutico:</strong> {formData.comprehensivePlan.medicalDiagnosis || 'N/A'}</p>
                        <p><strong>Código CIE-10 / CIE-11:</strong> {formData.comprehensivePlan.cieCode || 'N/A'}</p>
                        <p><strong>Código CIF:</strong> {formData.comprehensivePlan.cifCode || 'N/A'}</p>
                        <p><strong>Plan de Tratamiento:</strong> {formData.comprehensivePlan.treatmentPlan || 'N/A'}</p>
                        <p className="pt-1 font-semibold text-emerald-800">
                            ✓ Consentimiento Informado Aceptado por el Paciente / Tutor.
                        </p>
                    </div>

                    {/* FIRMAS ALINEADAS PERFECTAMENTE CON ESTAMPA DIGITAL */}
                    <div className="pt-24 grid grid-cols-2 gap-12 text-xs">
                        {/* Columna Paciente con Firma Estampada Oficial */}
                        <div className="text-center">
                            {(sealedSignatures.patient || (initialHistory ? '' : formData.comprehensivePlan.patientSignature)) ? (
                                <img
                                    src={sealedSignatures.patient || formData.comprehensivePlan.patientSignature}
                                    alt="Firma Paciente"
                                    className="h-12 mx-auto mb-1 object-contain"
                                />
                            ) : (
                                <div className="h-12"></div>
                            )}
                            <div className="border-t border-slate-800 mb-2 w-full"></div>
                            <p className="font-bold text-slate-900">{formData.patientName}</p>
                            <p className="text-slate-500">Firma del Paciente / Tutor</p>
                        </div>

                        {/* Columna Fisioterapeuta */}
                        <div className="text-center">
                            {formData.comprehensivePlan.physioSignature ? (
                                <img
                                    src={formData.comprehensivePlan.physioSignature}
                                    alt="Firma Fisioterapeuta"
                                    className="h-12 mx-auto mb-1 object-contain"
                                />
                            ) : (
                                <div className="h-12"></div>
                            )}
                            <div className="border-t border-slate-800 mb-2 w-full"></div>
                            <p className="font-bold text-slate-900">{formData.therapistName}</p>
                            <p className="text-slate-600">Cédula: {formData.comprehensivePlan.physioLicense || 'N/A'}</p>
                            <p className="text-slate-500">Firma del Fisioterapeuta</p>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};