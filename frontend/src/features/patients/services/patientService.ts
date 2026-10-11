import api from '../../../api/axios';
import type { PatientDTO } from '../../../types/patient';

export const patientService = {
    // Obtener listado de pacientes
    getAll: async (): Promise<PatientDTO[]> => {
        const response = await api.get<PatientDTO[]>('/v1/patients');
        return response.data;
    },

    // Registrar paciente rápido con Nombre y Correo
    create: async (data: { fullName: string; email: string; acceptsPrivacyPolicy: boolean }): Promise<PatientDTO> => {
        const response = await api.post<PatientDTO>('/v1/patients', data);
        return response.data;
    },

    // Llamada destructiva Fase 4
    delete: async (patientId: string): Promise<void> => {
        await api.delete(`/v1/patients/${patientId}`);
    },
};