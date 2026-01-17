import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glass?: boolean
  gradient?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  hover = false, 
  glass = false,
  gradient = false 
}: CardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300'
  
  const variants = {
    default: 'bg-white border border-gray-100 shadow-card',
    glass: 'glass-card',
    gradient: 'cricket-gradient text-white',
  }
  
  const hoverStyles = hover ? 'hover:shadow-premium hover:-translate-y-1 cursor-pointer' : ''
  
  const variant = glass ? 'glass' : gradient ? 'gradient' : 'default'
  
  return (
    <div className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  )
}
