import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'success' | 'warning' | 'error' | 'info' | 'pending' | 'approved' | 'rejected'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  pulse?: boolean
}

export default function Badge({ 
  children, 
  variant = 'info', 
  size = 'md', 
  icon, 
  pulse = false 
}: BadgeProps) {
  const baseStyles = 'status-badge font-medium'
  
  const variants = {
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    error: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    approved: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-100 text-red-800 border border-red-200',
  }
  
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }
  
  const pulseEffect = pulse ? 'animate-pulse-slow' : ''
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${pulseEffect}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}