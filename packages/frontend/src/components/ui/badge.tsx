import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-700 text-white shadow hover:bg-primary-800',
        secondary:
          'border-transparent bg-secondary-100 text-secondary-800 shadow-sm hover:bg-secondary-200',
        success:
          'border-transparent bg-success-100 text-success-800 shadow-sm hover:bg-success-200',
        warning:
          'border-transparent bg-warning-100 text-warning-800 shadow-sm hover:bg-warning-200',
        error:
          'border-transparent bg-error-100 text-error-800 shadow-sm hover:bg-error-200',
        outline:
          'text-neutral-950 border-neutral-200 dark:border-neutral-800 dark:text-neutral-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
