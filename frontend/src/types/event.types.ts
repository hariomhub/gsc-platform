export type EventCategory = 'webinar' | 'seminar' | 'workshop' | 'podcast';

export interface Event {
  id:             number;
  title:          string;
  date:           string;
  location?:      string;
  description?:   string;
  link?:          string;
  event_category: EventCategory;
  is_upcoming:    boolean;
  is_published:   boolean;
  recording_url?: string;
  banner_image?:  string;
  created_at:     string;
}

export interface EventRegistration {
  name:             string;
  email:            string;
  organization?:    string;
  phone?:           string;
  notes?:           string;
  consent_to_share: boolean;
}
