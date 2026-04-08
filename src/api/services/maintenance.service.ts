import api from '../client';
import type { 
    ScheduledJob, 
    ScheduledJobsListResponse, 
    ScheduledJobResponse,
    ToggleJobRequest,
    CreateJobRequest 
} from '../../types/maintenance.types';

export const MaintenanceService = {
    /**
     * Fetch the status of all background automation jobs
     * Endpoint: GET /api/v1/scheduled-jobs
     */
    getScheduledJobs: async (): Promise<ScheduledJob[]> => {
        const response = await api.get<ScheduledJobsListResponse>('scheduled-jobs');
        return response.data.data;
    },

    /**
     * Start/Stop a specific background job
     * Endpoint: PUT /api/v1/scheduled-jobs/:name/toggle
     */
    toggleJobStatus: async (name: string, action: 'start' | 'stop'): Promise<ScheduledJob> => {
        const response = await api.put<ScheduledJobResponse>(`scheduled-jobs/${name}/toggle`, { action });
        return response.data.data;
    },

    /**
     * Persist a new automation rule
     * Endpoint: POST /api/v1/scheduled-jobs
     */
    createScheduledJob: async (data: CreateJobRequest): Promise<ScheduledJob> => {
        const response = await api.post<ScheduledJobResponse>('scheduled-jobs', data);
        return response.data.data;
    }
};
