import type { ApiResponse } from './user.types';

export interface SpecialistStats {
    summary: {
        totalPatients: number;
        activeAssessments: number;
    };
    demographics: {
        gender: {
            male: number;
            female: number;
            other: number;
        };
        ageGroups: Record<string, number>;
    };
    clinical: {
        moodDistribution: Record<string, number>;
    };
    engagement: {
        enrollmentTrend: Array<{
            month: string;
            count: number;
        }>;
    };
    assessments: {
        total: number;
        completed: number;
        pending: number;
    };
}

export interface PatientStats {
    activity: {
        currentStreak: number;
        totalMoodLogs: number;
    };
    moodAnalytics: {
        period: string;
        distribution: Record<string, number>;
        trend?: Array<{
            date: string;
            score: number;
        }>;
    };
    consultations: {
        total: number;
        attended: number;
        upcoming: number;
        cancelled: number;
    };
    assessments: {
        completionRate: number;
        completed: number;
        pending: number;
    };
}

export interface SuperAdminStats {
    revenue: {
        total: number;
        formatted: string;
    };
    users: {
        total: number;
        byRole: Record<string, number>;
    };
    consultations: {
        active: number;
        total: number;
    };
    entities: {
        hospitals: number;
    };
}

export interface SpecialistStatsResponse extends ApiResponse<SpecialistStats> { }
export interface PatientStatsResponse extends ApiResponse<PatientStats> { }
export interface SuperAdminStatsResponse extends ApiResponse<SuperAdminStats> { }
