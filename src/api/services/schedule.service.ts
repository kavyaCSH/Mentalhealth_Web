import api from '../client';
import type { ApiResponse } from '../../types/common.types';
import type { 
    SpecialistDirectoryNode, 
    TimeSlot, 
    WeeklyScheduleRule, 
    ScheduleOverridePayload,
    ScheduleDirectoryResponse,
    TimeSlotsResponse
} from '../../types/schedule.types';

export const ScheduleService = {
    // ==========================================
    // Part 1: Real-Time Availability (Public/Patient)
    // ==========================================

    /**
     * Fetches all active specialists and calculates their Next Available Slot.
     * Endpoint: GET /api/v1/specialists/schedule/directory
     */
    getDirectory: async (): Promise<SpecialistDirectoryNode[]> => {
        const response = await api.get<ScheduleDirectoryResponse>('specialists/schedule/directory');
        return response.data?.data || [];
    },

    /**
     * Dynamically calculates time blocks based on parameters.
     * Endpoint: GET /api/v1/specialists/schedule/slots
     */
    getAvailableSlots: async (params: {
        specialist_id?: string | number;
        role?: string;
        date?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<TimeSlot[]> => {
        const response = await api.get<TimeSlotsResponse>('specialists/schedule/slots', { params });
        const data = response.data?.data;
        
        if (data?.slots) return data.slots;
        if (data?.results) {
            // Flatten the results dictionary into a single array of slots
            return Object.entries(data.results).flatMap(([date, slots]) => 
                slots.map(slot => ({ ...slot, date }))
            );
        }
        return [];
    },

    // ==========================================
    // Part 2: Calendar Management (Admin/Doctor)
    // ==========================================

    /**
     * Allows a professional to define their standard working week.
     * Endpoint: PUT /api/v1/specialists/schedule/me/weekly
     */
    setWeeklyAvailability: async (rules: WeeklyScheduleRule[]): Promise<ApiResponse<unknown>> => {
        const response = await api.put('specialists/schedule/me/weekly', rules);
        return response.data;
    },

    /**
     * Forced Admin Override - List schedule blocks.
     * Endpoint: GET /api/v1/specialists/schedule
     */
    listOverrides: async (userId: string | number): Promise<any[]> => {
        // We try the collection endpoint with userId query param as per manual
        // If it 400s, we fallback to the path-based fetch (which might return a single entry)
        try {
            const response = await api.get('specialists/schedule', { 
                params: { userId: Number(userId) } 
            });
            const data = response.data?.data;
            if (Array.isArray(data)) return data;
            if (data?.schedules && Array.isArray(data.schedules)) return data.schedules;
            if (data && typeof data === 'object') return [data];
            return [];
        } catch (error) {
            // Fallback to path-based single fetch if directory ID is used
            const response = await api.get(`specialists/schedule/${userId}`);
            const data = response.data?.data;
            if (Array.isArray(data)) return data;
            if (data?.schedules && Array.isArray(data.schedules)) return data.schedules;
            if (data && typeof data === 'object') return [data];
            return [];
        }
    },

    /**
     * Forced Admin Override - Create a schedule block.
     * Endpoint: POST /api/v1/specialists/schedule
     */
    createOverride: async (payload: ScheduleOverridePayload): Promise<ApiResponse<unknown>> => {
        const response = await api.post('specialists/schedule', payload);
        return response.data;
    },

    /**
     * Forced Admin Override - Update a schedule block.
     * Endpoint: PUT /api/v1/specialists/schedule/:id
     */
    updateOverride: async (id: string, payload: Partial<ScheduleOverridePayload>): Promise<ApiResponse<unknown>> => {
        const response = await api.put(`specialists/schedule/${id}`, payload);
        return response.data;
    },

    /**
     * Forced Admin Override - Delete a schedule block.
     * Endpoint: DELETE /api/v1/specialists/schedule/:id
     */
    deleteOverride: async (id: string): Promise<ApiResponse<unknown>> => {
        const response = await api.delete(`specialists/schedule/${id}`);
        return response.data;
    }
};
