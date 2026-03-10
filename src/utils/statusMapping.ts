export type StatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const getStatusColor = (status: StatusType | string) => {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return {
                bg: 'bg-blue-50',
                text: 'text-blue-600',
                border: 'border-blue-200',
                dot: 'bg-blue-500',
                hex: '#3b82f6' // Blue
            };
        case 'in_progress':
            return {
                bg: 'bg-amber-50',
                text: 'text-amber-600',
                border: 'border-amber-200',
                dot: 'bg-amber-500',
                hex: '#f59e0b' // Amber
            };
        case 'completed':
            return {
                bg: 'bg-green-50',
                text: 'text-green-600',
                border: 'border-green-200',
                dot: 'bg-green-500',
                hex: '#10b981' // Green
            };
        case 'cancelled':
            return {
                bg: 'bg-red-50',
                text: 'text-red-600',
                border: 'border-red-200',
                dot: 'bg-red-500',
                hex: '#ef4444' // Red
            };
        default:
            return {
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-200',
                dot: 'bg-slate-500',
                hex: '#64748b' // Slate
            };
    }
};
