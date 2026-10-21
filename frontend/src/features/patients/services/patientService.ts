import api from '../../../api/axios';
import type { PatientDTO } from '../../../types/patient';

export const patientService = {
    // Obtener listado de pacientes
    getAll: async (): Promise<PatientDTO[]> => {
        const response = await api.get<PatientDTO[]>('/v1/patients');
        return response.data;
    },

    // Registrar paciente rápido con Nombre, Correo y Fisioterapeuta opcional (si lo crea Admin/Recepción)
    create: async (data: { fullName: string; email: string; acceptsPrivacyPolicy: boolean; assignedPhysioUsername?: string }): Promise<PatientDTO> => {
        const response = await api.post<PatientDTO>('/v1/patients', data);
        return response.data;
    },

    // Reasignar fisioterapeuta de cabecera (Solo Admin)
    assignPhysio: async (patientId: string, physioUsername: string): Promise<PatientDTO> => {
        const response = await api.patch<PatientDTO>(`/v1/patients/${patientId}/assign-physio`, null, {
            params: { physioUsername },
        });
        return response.data;
    },

    // Borrado inteligente (si fue creado por error) o Derecho al Olvido
    delete: async (patientId: string): Promise<{ message: string }> => {
        const response = await api.delete<{ message: string }>(`/v1/patients/${patientId}`);
        return response.data;
    },
};