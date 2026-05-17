export type UserRole = 'founding_member' | 'council_member' | 'professional';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ProfessionalSubType = 'working_professional' | 'final_year_undergrad';
export type AuthProvider = 'local' | 'linkedin';

export interface User {
  id:                       number;
  name:                     string;
  email:                    string;
  password_hash?:           string;
  role:                     UserRole;
  professional_sub_type?:   ProfessionalSubType;
  status:                   UserStatus;
  membership_expires_at?:   Date | null;
  bio?:                     string;
  photo_url?:               string;
  linkedin_url?:            string;
  linkedin_id?:             string;
  auth_provider:            AuthProvider;
  organization_name?:       string;
  monthly_downloads:        number;
  monthly_downloads_reset?: Date;
  profile_badge?:           string;
  created_at:               Date;
  updated_at:               Date;
}

export interface PublicUser {
  id:                number;
  name:              string;
  role:              UserRole;
  organization_name?: string;
  photo_url?:        string;
  linkedin_url?:     string;
  bio?:              string;
  profile_badge?:    string;
}
