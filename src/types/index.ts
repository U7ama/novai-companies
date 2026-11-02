import type { Icons } from '@/components/icons';

export interface NavItem {
  title: string;
  url: string;
  icon?: keyof typeof Icons;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}
