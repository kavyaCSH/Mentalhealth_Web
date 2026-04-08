export type AutomationActionType = 'NOTIFICATION_BROADCAST' | 'AI_TIP_BROADCAST' | 'DB_CLEANUP';

export interface ScheduledJob {
    name: string;
    status: 'scheduled' | 'running' | 'failed' | 'paused';
    isRunning: boolean;
    lastRun?: string;
    nextRun?: string;
    description?: string;
    cron?: string;
    actionType?: AutomationActionType;
    payload?: any;
}

export interface CreateJobRequest {
    name: string;
    description: string;
    cron: string;
    actionType: AutomationActionType;
    payload: {
        role?: string;
        title?: string;
        message?: string;
    } | any;
}

export interface ToggleJobRequest {
    action: 'start' | 'stop';
}

export interface ScheduledJobResponse {
    code: number;
    message: string;
    data: ScheduledJob;
}

export interface ScheduledJobsListResponse {
    success: boolean;
    data: ScheduledJob[];
}
