'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { useLanguage } from '@/features/i18n/i18n-context';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const { t } = useLanguage();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--toast-close-button-start': 'auto',
          '--toast-close-button-end': '0',
          '--toast-close-button-transform': 'translate(35%, -35%)'
        } as React.CSSProperties
      }
      position='top-center'
      closeButton
      swipeDirections={['left', 'right', 'top', 'bottom']}
      toastOptions={{ closeButtonAriaLabel: t.dismissNotification }}
      {...props}
    />
  );
};

export { Toaster };
