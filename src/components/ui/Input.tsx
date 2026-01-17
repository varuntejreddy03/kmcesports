import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    success, 
    icon, 
    rightIcon, 
    helperText, 
    className = '', 
    ...props 
  }, 
  ref
) => {
  const hasError = !!error
  const hasSuccess = !!success
  
  const inputStyles = `
    input-field
    ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
    ${hasSuccess ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20' : ''}
    ${icon ? 'pl-12' : ''}
    ${rightIcon ? 'pr-12' : ''}
  `
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-navy-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`${inputStyles} ${className}`}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="text-sm">
          {error && <p className="text-red-600 font-medium">{error}</p>}
          {success && <p className="text-green-600 font-medium">{success}</p>}
          {helperText && !error && !success && (
            <p className="text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input