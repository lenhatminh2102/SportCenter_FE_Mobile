export const canManageMembers = (role?: string) => role === 'CENTER_MANAGER' || role === 'RECEPTIONIST';
export const canDeleteMembers = (role?: string) => role === 'CENTER_MANAGER';
