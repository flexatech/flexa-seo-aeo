import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    // Stable marker (no Tailwind prefix): the WP-admin form-chrome
                    // reset in styles/index.css keys off it, even inside portals.
                    "flexa-seo-aeo-control",
                    "fsa:flex fsa:h-9 fsa:w-full fsa:rounded-md fsa:border fsa:border-slate-300 fsa:bg-white fsa:px-3 fsa:py-1 fsa:text-sm fsa:shadow-sm fsa:transition-colors",
                    "fsa:placeholder:text-slate-400",
                    "fsa:focus-visible:outline-none fsa:focus-visible:ring-2 fsa:focus-visible:ring-brand-500 fsa:focus-visible:ring-offset-1",
                    "fsa:disabled:cursor-not-allowed fsa:disabled:opacity-50",
                    className,
                )}
                {...props}
            />
        );
    },
);
Input.displayName = "Input";
