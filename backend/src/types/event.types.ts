export type EventCategory = 'webinar' | 'seminar' | 'workshop' | 'podcast';

export interface Event {
  id:             number;
  title:          string;
  date:           Date;
  location?:      string;
  description?:   string;
  link?:          string;
  event_category: EventCategory;
  is_upcoming:    boolean;
  is_published:   boolean;
  recording_url?: string;
  banner_image?:  string;
  created_by?:    number;
  created_at:     Date;
  updated_at:     Date;
}
