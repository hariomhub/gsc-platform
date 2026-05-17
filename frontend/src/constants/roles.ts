import type { UserRole } from '@/types/user.types';

export const ROLES = {
  FOUNDING_MEMBER: 'founding_member' as UserRole,
  COUNCIL_MEMBER:  'council_member'  as UserRole,
  PROFESSIONAL:    'professional'    as UserRole,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  founding_member: 'Founding Member',
  council_member:  'GSC Council Member',
  professional:    'Sustainability Professional',
};

export const ROLE_BADGE: Record<UserRole, { bg: string; text: string }> = {
  founding_member: { bg: '#6D28D9', text: 'Founder' },
  council_member:  { bg: '#1A4731', text: 'Council' },
  professional:    { bg: '#0D9B6E', text: 'Member'  },
};

// Roles that can download knowledge hub resources
export const DOWNLOAD_ROLES: UserRole[] = [
  ROLES.FOUNDING_MEMBER,
  ROLES.COUNCIL_MEMBER,
];
