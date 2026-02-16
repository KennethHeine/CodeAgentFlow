import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:pointer-events-none',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-500',
        variant === 'secondary' && 'bg-surface-3 text-gray-200 hover:bg-surface-4 border border-border-default',
        variant === 'ghost' && 'text-gray-400 hover:text-gray-200 hover:bg-surface-2',
        variant === 'danger' && 'bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-600/30',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className,
      )}
      {...props}
    />
  );
}
