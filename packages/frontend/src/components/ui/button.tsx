import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]', // Ensuring 44x44px touch targets
  {
    variants: {
      variant: {
        default: 'bg-primary-700 text-white hover:bg-primary-800 active:bg-primary-900',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800',
        outline: 'border-2 border-primary-700 text-primary-700 hover:bg-primary-50 active:bg-primary-100',
        ghost: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
        link: 'text-primary-700 underline-offset-4 hover:underline',
        danger: 'bg-error-600 text-white hover:bg-error-700 active:bg-error-800',
        success: 'bg-success-600 text-white hover:bg-success-700 active:bg-success-800',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
