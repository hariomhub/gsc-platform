export type UserRole = 'founding_member' | 'council_member' | 'professional';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ProfessionalSubType = 'working_professional' | 'final_year_undergrad';

export interface User {
  id:                       number;
  name:                     string;
  email:                    string;
  role:                     UserRole;
  professional_sub_type?:   ProfessionalSubType;
  status:                   UserStatus;
  membership_expires_at?:   string | null;
  bio?:                     string;
  photo_url?:               string;
  linkedin_url?:            string;
  organization_name?:       string;
  monthly_downloads:        number;
  monthly_downloads_reset?: string;
  profile_badge?:           string;
  auth_provider:            'local' | 'linkedin';
  pending_sub_type_upgrade: boolean;
  sub_type_upgrade_status:  'none' | 'pending' | 'approved' | 'rejected';
  created_at:               string;
  updated_at:               string;
}
