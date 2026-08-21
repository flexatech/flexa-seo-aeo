import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
    "fsa:inline-flex fsa:cursor-pointer fsa:items-center fsa:justify-center fsa:gap-2 fsa:whitespace-nowrap fsa:rounded-md fsa:text-sm fsa:font-medium fsa:transition-colors fsa:focus-visible:outline-none fsa:focus-visible:ring-2 fsa:focus-visible:ring-offset-2 fsa:disabled:pointer-events-none fsa:disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "fsa:bg-brand-600 fsa:text-white fsa:hover:bg-brand-700 fsa:focus-visible:ring-brand-500",
                ghost: "fsa:bg-transparent fsa:hover:bg-slate-100 fsa:text-slate-900",
                outline:
                    "fsa:border fsa:border-slate-300 fsa:bg-white fsa:hover:bg-slate-50 fsa:text-slate-900",
                destructive:
                    "fsa:bg-red-600 fsa:text-white fsa:hover:bg-red-700 fsa:focus-visible:ring-red-500",
            },
            size: {
                default: "fsa:h-9 fsa:px-4 fsa:py-2",
                sm: "fsa:h-8 fsa:rounded-md fsa:px-3 fsa:text-xs",
                lg: "fsa:h-10 fsa:rounded-md fsa:px-6",
                icon: "fsa:h-9 fsa:w-9",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    },
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { buttonVariants };
