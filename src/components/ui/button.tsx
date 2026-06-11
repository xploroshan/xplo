import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glow"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300 cursor-pointer",
          {
            "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]":
              variant === "default",
            "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]":
              variant === "destructive",
            "border border-input bg-background shadow-sm hover:bg-accent/10 hover:border-accent/40 hover:text-accent-foreground active:scale-[0.98]":
              variant === "outline",
            "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]":
              variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground":
              variant === "ghost",
            "text-primary underline-offset-4 hover:underline":
              variant === "link",
            "bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 bg-[length:200%_auto] text-white shadow-lg shadow-orange-500/25 hover:bg-[position:right_center] hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]":
              variant === "glow",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-11 rounded-lg px-8 text-base": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
