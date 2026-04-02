export interface ApiResponse<T> {
    success: boolean;
    code: number;
    message: string;
    data: T;
}

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
    city?: string;
    isdCode?: string;
    mobile?: string;
    is2fa?: boolean;
    communicationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
    };
    profileImage?: string;
    languages?: string[];
    skills?: string[];
    qualifications?: string;
    emergencyContact?: string;
    bloodGroup?: string;
    timezoneId?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    createdAt?: string;
    updatedAt?: string;
    plan?: string;
}

export interface Patient extends User {
    emergencyContact?: string;
    bloodGroup?: string;
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
    psychologist: number;
    nurse: number;
    social_worker: number;
    admin: number;
    total?: number;
    activeCount?: number;
    consultCount?: number;
}
