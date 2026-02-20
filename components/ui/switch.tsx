import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          ref={ref}
          checked={checked}
          onChange={onChange}
          {...props}
        />
        <div className={cn(
          "peer h-6 w-11 rounded-full bg-gray-700 transition-colors peer-checked:bg-blue-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800",
          className
        )}>
          <div className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </div>
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
