import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function Icon({ 
  icon: IconComponent, 
  size = 'md', 
  className, 
  color 
}: IconProps) {
  return (
    <IconComponent
      className={clsx(
        sizeClasses[size],
        color && `text-${color}`,
        className
      )}
    />
  );
}
