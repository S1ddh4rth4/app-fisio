import api from '../../../api/axios';
import type {
    PatientPackageRequestDTO,
    PatientPackageResponseDTO,
    AppointmentPaymentUpdateDTO
} from '../../../types/payment';
import type { AppointmentResponseDTO } from '../../../types/appointment';

export const paymentService = {
    // Comprar / registrar paquete para paciente
    buyPackage: async (data: PatientPackageRequestDTO): Promise<PatientPackageResponseDTO> => {
        const response = await api.post<PatientPackageResponseDTO>('/v1/payments/packages', data);
        return response.data;
    },

    // Obtener paquetes de un paciente
    getPatientPackages: async (patientId: string): Promise<PatientPackageResponseDTO[]> => {
        const response = await api.get<PatientPackageResponseDTO[]>(`/v1/payments/packages/patient/${patientId}`);
        return response.data;
    },

    // Cobrar o actualizar pago de una cita
    updateAppointmentPayment: async (
        appointmentId: number,
        data: AppointmentPaymentUpdateDTO
    ): Promise<AppointmentResponseDTO> => {
        const response = await api.put<AppointmentResponseDTO>(`/v1/payments/appointments/${appointmentId}`, data);
        return response.data;
    },
};