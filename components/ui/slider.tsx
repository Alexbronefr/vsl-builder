import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min = 0, max = 100, value, onChange, ...props }, ref) => {
    return (
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-blue-600",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
