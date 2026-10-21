import React from 'react';
import {
  BookOpen,
  Printer,
  FileText,
  Smartphone,
  CreditCard,
  Mail,
  Layers,
  Copy,
  CheckCircle2,
  Sparkles,
  type LucideProps
} from 'lucide-react';

export interface GuideIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
}

export const GuideIcon: React.FC<GuideIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Printer':
      return <Printer {...props} />;
    case 'FileText':
      return <FileText {...props} />;
    case 'Smartphone':
      return <Smartphone {...props} />;
    case 'CreditCard':
      return <CreditCard {...props} />;
    case 'Mail':
      return <Mail {...props} />;
    case 'Layers':
      return <Layers {...props} />;
    case 'Copy':
      return <Copy {...props} />;
    case 'CheckCircle2':
      return <CheckCircle2 {...props} />;
    case 'Sparkles':
      return <Sparkles {...props} />;
    case 'BookOpen':
    default:
      return <BookOpen {...props} />;
  }
};
