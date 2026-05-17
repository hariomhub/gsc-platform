export type FeedPostType = 'esg_product' | 'poll' | 'event' | 'case_study' | 'general';

export interface FeedPost {
  id:               number;
  author_id:        number;
  post_type:        FeedPostType;
  content:          string;
  tags?:            string[];
  poll_options?:    string[];
  poll_ends_at?:    Date;
  event_link?:      string;
  reaction_counts?: Record<string, number>;
  is_hidden:        boolean;
  is_edited:        boolean;
  like_count:       number;
  comment_count:    number;
  save_count:       number;
  score:            number;
  created_at:       Date;
  updated_at:       Date;
}
