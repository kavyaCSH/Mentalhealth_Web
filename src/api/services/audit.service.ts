import api from '../client';
import type { AuditLog, AuditLogsResponse } from '../../types/audit.types';

export interface AuditLogFilter {
    user?: string | number;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

export const AuditService = {
    /**
     * GET /api/v1/audit-logs
     * Access: Super Admin Only
     * Description: Provides the "Security Camera" view of all administrative actions.
     */
    getLogs: async (filters: AuditLogFilter = {}): Promise<AuditLogsResponse['data']> => {
        const response = await api.get('audit-logs', { params: filters });
        return response.data?.data ?? response.data;
    }
};
