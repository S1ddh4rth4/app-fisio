import api from '../../../api/axios';
import type { DashboardSummaryDTO } from '../../../types/dashboard';

export const dashboardService = {
    getSummary: async (): Promise<DashboardSummaryDTO> => {
        const response = await api.get<DashboardSummaryDTO>('/v1/dashboard/summary');
        return response.data;
    },
};