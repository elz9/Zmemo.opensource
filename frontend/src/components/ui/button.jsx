import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"


const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-black text-white hover:bg-gray-800",
                destructive: "bg-red-500 text-white hover:bg-red-600",
                outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
                secondary: "bg-gray-100 text-black hover:bg-gray-200",
                ghost: "hover:bg-gray-100",
                link: "text-black underline-offset-4 hover:underline",
            },
            size: {
                default: "h-8 px-3 py-1.5",
                sm: "h-7 rounded-md px-2.5 text-[10px]",
                lg: "h-9 rounded-md px-5",
                icon: "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
