export type ResourceType =
  | 'framework' | 'whitepaper' | 'product' | 'video'
  | 'article'   | 'tool'       | 'news'    | 'report' | 'policy';

export type ResourceStatus = 'pending' | 'approved' | 'rejected';

export interface Resource {
  id:           number;
  title:        string;
  description?: string;
  abstract?:    string;
  file_url?:    string;
  demo_url?:    string;
  type:         ResourceType;
  status:       ResourceStatus;
  uploader_id?: number;
  created_at:   Date;
  updated_at:   Date;
}
