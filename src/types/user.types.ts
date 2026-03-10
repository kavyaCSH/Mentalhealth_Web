export type UserRole =
    | 'super_admin'
    | 'admin'
    | 'hospital'
    | 'psychiatrist'
    | 'psychologist'
    | 'nurse'
    | 'social_worker'
    | 'counselor'
    | 'patient';

export interface User {
    id: string;
    userId?: string | number;
    _id?: string;
    username?: string;
    firstName: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
    role: UserRole;
    isActive?: boolean;
    avatar?: string;
    diagnosis?: string;
    riskLevel?: 'low' | 'medium' | 'high';
    lastSession?: string;
    gender?: 'male' | 'female' | 'other' | string;
    dateOfBirth?: string;
    dob?: string;
    address?: string;
    assessments_count?: number;
    specialization?: string;
    experienceYears?: number;
    consultationFee?: number;
    about?: string;
    createdAt?: string;
    updatedAt?: string;
    plan?: string;
}

export interface Patient extends User {
    emergencyContact?: string;
}

export interface ClinicalNote {
    id: string;
    content: string;
    author: string;
    createdAt: string;
}

export interface UserStats {
    patient: number;
    psychiatrist: number;
    nurse: number;
    admin: number;
    total?: number;
    activeCount?: number;
    consultCount?: number;
}
