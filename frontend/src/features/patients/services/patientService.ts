import api from '../../../api/axios';
import type { PatientDTO } from '../../../types/patient';

export const patientService = {
    // Obtener todos los pacientes
    getAll: async (): Promise<PatientDTO[]> => {
        const response = await api.get<PatientDTO[]>('/v1/patients');
        return response.data;
    },

    // Registrar un nuevo paciente utilizando el endpoint de Auth
    create: async (data: { username: string; email: string; password?: string }): Promise<PatientDTO> => {
        const response = await api.post<PatientDTO>('/auth/register', {
            username: data.username,
            email: data.email,
            password: data.password || 'paciente123',
            role: 'ROLE_PACIENTE',
        });
        return response.data;
    },
};