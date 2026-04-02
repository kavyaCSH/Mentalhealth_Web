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

export interface SpecialistStatsResponse extends ApiResponse<SpecialistStats> { }
export interface PatientStatsResponse extends ApiResponse<PatientStats> { }
