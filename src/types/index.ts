export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface GuideStep {
  id: string;
  guide_id: string;
  instruction: string;
  description?: string | null;
  note?: string | null;
  step_order: number;
  created_at: string;
}

export interface Guide {
  id: string;
  title: string;
  description?: string | null;
  category_id: string;
  icon?: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  steps?: GuideStep[];
}

export interface GuideStepDraft {
  tempId: string;
  id?: string;
  instruction: string;
  description?: string;
  note?: string;
  step_order: number;
}

export interface GuideFormData {
  title: string;
  description?: string;
  category_id: string;
  icon?: string;
  published: boolean;
  steps: GuideStepDraft[];
}

export type IconName =
  | 'BookOpen'
  | 'Printer'
  | 'FileText'
  | 'Smartphone'
  | 'CreditCard'
  | 'Mail'
  | 'Layers'
  | 'Copy'
  | 'CheckCircle2'
  | 'Sparkles';
