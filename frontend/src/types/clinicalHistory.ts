export interface ClinicalHistoryData {
    // PÁGINA 1: Anamnesis & Datos Demográficos Completos
    patientName: string;
    birthDate: string; //  NUEVO: Fecha de nacimiento
    curp: string; //  NUEVO: CURP / ID Oficial
    address: string;
    phone: string;
    emergencyContactName: string; //  NUEVO: Contacto de emergencia
    emergencyContactPhone: string; //  NUEVO: Teléfono de emergencia
    occupation: string;
    gender: string;
    age: string;
    maritalStatus: string;
    education: string;
    recordNumber: string;
    evaluationDate: string;
    therapistName: string;


    // Exploración Física & Signos Vitales
    weight: string; // en kg
    height: string; // en metros o cm
    bmi: string; // Autocalculado
    ethnicity: string;
    consultationReason: string;
    previousTreatments: string;
    currentMedication: string; //  NUEVO: Fármacos actuales / contraindicaciones
    pathologicalHistory: Record<string, { yes: boolean; no: boolean; details: string }>;
    vitals: { bp: string; temp: string; hr: string; rr: string; spo2: string }; //  spo2 NUEVO
    spasms: { present: boolean; location: string };
    habits: Record<string, { yes: boolean; no: boolean; details: string }>;
    pregnancy: { isPregnant: boolean; details: string; childrenCount: string };
    rehabDiagnosis: { reflexes: string; sensitivity: string; language: string; other: string };
    surgicalScar: { location: string; keloid: boolean; retractile: boolean; open: boolean; adherent: boolean; hypertrophic: boolean };
    transfers: { initial: string; final: string };
    gaitDeambulation: { free: boolean; spastic: boolean; claudicating: boolean; ataxic: boolean; withHelp: boolean; other: string; observations: string };
    painScale: number; // 0 a 10

    // PÁGINA 2: Muscular & Goniometría & SOAP
    muscleEvaluation: {
        ms: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        mi: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        trunk: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        neck: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
    };
    goniometry: {
        ms: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        mi: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        trunk: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
        neck: { eval1L: string; eval1R: string; eval2L: string; eval2R: string };
    };
    initialSoap: { subjective: string; objective: string; analysis: string; plan: string };

    // PÁGINA 3: Miembros Superiores
    upperLimbs: {
        shoulder: { flexion: string; extension: string; abd: string; add: string };
        shoulderObs: string;
        elbow: { flexion: string; extension: string; extRot: string; intRot: string };
        elbowObs: string;
        forearm: { supination: string; pronation: string; extRot: string; intRot: string; ulnarDev: string; radialDev: string };
        forearmObs: string;
        wristFingers: { palmarFlex: string; dorsalExt: string; fingers: Record<string, { mcf: string; ifp: string; ifd: string; abd: string }> };
        wristObs: string;
    };

    // PÁGINA 4: Miembros Inferiores
    lowerLimbs: {
        hip: { flexExtKnee: string; hipExt: string; abd: string; add: string };
        hipObs: string;
        knee: { flexExtKnee: string; kneeFlex: string; kneeExt: string };
        kneeObs: string;
        ankle: { plantFlex: string; dorsiFlex: string; inversion: string; eversion: string; extRot: string; intRot: string };
        ankleObs: string;
    };

    // PÁGINA 5: Análisis de la Marcha
    gaitAnalysis: {
        initialStep: string;
        stepLengthHeight: Record<string, boolean>;
        stepSymmetry: string;
        stepContinuity: string;
        trajectory: string;
        trunk: string;
        gaitPosture: string;
        gaitScore: string;
    };

    // PÁGINA 6: Evaluación Postural
    posturalEvaluation: {
        frontal: string | Record<string, { degree: 'L' | 'M' | 'S' | ''; observations: string }>;
        lateral: string | Record<string, { degree: 'L' | 'M' | 'S' | ''; observations: string }>;
        posterior: string | Record<string, { degree: 'L' | 'M' | 'S' | ''; observations: string }>;
    };

    // PÁGINA 7: Batería Breve, Plan Analítico, CIF, CIE-10 & Legal
    functionalBattery: {
        balanceTests: { feetTogether: string; semiTandem: string; tandem: string; balanceScore: string; notPerformedReason: string };
        comments: string;
    };
    comprehensivePlan: {
        objectives: string;
        hypothesis: string;
        bodyStructure: string;
        bodyFunction: string;
        activity: string;
        participation: string;
        medicalDiagnosis: string;
        cieCode: string; //  NUEVO: Código CIE-10 / CIE-11
        treatmentPlan: string;
        cifDiagnosis: string;
        cifCode: string;
        physioSignature: string;
        physioLicense: string; //  NUEVO: Cédula Profesional del Terapeuta
        informedConsentAccepted: boolean; //  NUEVO: Consentimiento Informado Aceptado
        patientSignature?: string; //  NUEVO: Firma digital del paciente
    };
}

export interface ClinicalHistoryResponseDTO {
    id: string;
    patientId: string;
    patientName: string;
    physiotherapistId: string;
    physiotherapistName: string;
    recordNumber: string;
    evaluationType: string;
    mainDiagnosis: string;
    painLevel: number;
    formDataJson: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClinicalHistoryRequestDTO {
    id?: string;
    patientId: string;
    recordNumber?: string;
    evaluationType?: string;
    mainDiagnosis?: string;
    painLevel?: number;
    formDataJson: string;
}