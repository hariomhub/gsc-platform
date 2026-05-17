export type ResourceType =
  | 'framework' | 'whitepaper' | 'product' | 'video'
  | 'article' | 'tool' | 'news' | 'report' | 'policy';

export interface Resource {
  id:            number;
  title:         string;
  description?:  string;
  abstract?:     string;
  file_url?:     string;
  demo_url?:     string;
  type:          ResourceType;
  status:        'pending' | 'approved' | 'rejected';
  uploader_id?:  number;
  uploader_name?:string;
  created_at:    string;
  avg_rating?:   number;
  review_count?: number;
}
