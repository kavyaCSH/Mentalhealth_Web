export type StatusType = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const getStatusColor = (status: StatusType | string | null | undefined) => {
    const s = String(status || 'default').toLowerCase();
    switch (s) {
        case 'scheduled':
            return {
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                border: 'border-blue-500/20',
                dot: 'bg-blue-500/100',
                hex: '#3b82f6' // Blue
            };
        case 'in_progress':
            return {
                bg: 'bg-amber-500/10',
                text: 'text-amber-600',
                border: 'border-amber-500/20',
                dot: 'bg-amber-500/100',
                hex: '#f59e0b' // Amber
            };
        case 'completed':
            return {
                bg: 'bg-green-500/10',
                text: 'text-green-600',
                border: 'border-green-500/20',
                dot: 'bg-green-500/100',
                hex: '#10b981' // Green
            };
        case 'cancelled':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-600',
                border: 'border-red-500/20',
                dot: 'bg-red-500/100',
                hex: '#ef4444' // Red
            };
        default:
            return {
                bg: 'bg-slate-500/10',
                text: 'text-slate-500',
                border: 'border-slate-500/20',
                dot: 'bg-slate-500/100',
                hex: '#64748b' // Slate
            };
    }
};
