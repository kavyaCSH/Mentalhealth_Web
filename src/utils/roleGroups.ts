import type { UserRole } from '../types/user.types';

export const ROLE_GROUPS = {
    PATIENT: ['patient'] as UserRole[],
    CLINICAL: ['psychiatrist', 'psychologist', 'nurse', 'social_worker', 'counselor'] as UserRole[],
    ADMIN: ['admin', 'super_admin', 'hospital'] as UserRole[],
    HOSPITAL: ['hospital'] as UserRole[],
};

export const isInRoleGroup = (role: UserRole | undefined, group: keyof typeof ROLE_GROUPS) => {
    if (!role) return false;
    return ROLE_GROUPS[group].includes(role);
};
