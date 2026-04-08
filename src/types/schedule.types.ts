export interface NextAvailableSlot {
    date: string;
    startTime: string;
    endTime: string;
}

export interface SpecialistDirectoryNode {
    userId: string | number;
    firstName: string;
    lastName: string;
    role: string;
    nextAvailableSlot?: NextAvailableSlot;
}

export interface TimeSlot {
    id?: string;
    date?: string;
    startTime: string;
    endTime: string;
    available: boolean;
    reason?: string | null;
    description?: string | null;
    dayOfWeek?: number | null;
    isRecurring?: boolean;
    providerId?: string | number;
    providerName?: string;
}

export interface BreakSlot {
    startTime: string;
    endTime: string;
    reason?: string;
}

export interface WeeklyScheduleRule {
    dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string;
    endTime: string;
    slotDuration: number; // in minutes
    bufferTime: number; // in minutes
    breaks?: BreakSlot[];
}

export interface ScheduleOverridePayload {
    specialist_id: string | number;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

export interface ScheduleDirectoryResponse {
    code: number;
    data: SpecialistDirectoryNode[];
}

export interface TimeSlotsResponse {
    code: number;
    message?: string;
    data: {
        date?: string;
        role?: string;
        slots?: TimeSlot[];
        results?: { [date: string]: TimeSlot[] };
        specialist_id?: number | string;
    };
}
