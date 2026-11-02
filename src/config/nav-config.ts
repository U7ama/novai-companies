import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Pipeline',
    items: [
      {
        title: 'Companies',
        url: '/companies',
        icon: 'product',
        isActive: true,
        items: []
      },
      {
        title: 'Contacts',
        url: '#',
        icon: 'user',
        disabled: true,
        label: 'Soon',
        items: []
      },
      {
        title: 'Deals',
        url: '#',
        icon: 'kanban',
        disabled: true,
        label: 'Soon',
        items: []
      }
    ]
  }
];
