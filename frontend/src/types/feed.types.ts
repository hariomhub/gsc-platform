export type FeedPostType = 'esg_product' | 'poll' | 'event' | 'case_study' | 'general';

export interface FeedPost {
  id:               number;
  author_id:        number;
  author_name?:     string;
  author_photo?:    string;
  author_role?:     string;
  post_type:        FeedPostType;
  content:          string;
  tags?:            string[];
  poll_options?:    string[];
  poll_ends_at?:    string;
  event_link?:      string;
  reaction_counts?: Record<string, number>;
  is_hidden:        boolean;
  is_edited:        boolean;
  like_count:       number;
  comment_count:    number;
  save_count:       number;
  media?:           FeedMedia[];
  is_liked?:        boolean;
  is_saved?:        boolean;
  user_reaction?:   string;
  created_at:       string;
  updated_at:       string;
}

export interface FeedMedia {
  id:   number;
  url:  string;
  type: 'image' | 'video';
}

export interface FeedComment {
  id:           number;
  post_id:      number;
  author_id:    number;
  author_name?: string;
  author_photo?:string;
  parent_id?:   number;
  content:      string;
  replies?:     FeedComment[];
  created_at:   string;
}
