import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: Array<{ value: string; label: string }>;
}

/**
 * Lightweight native `<select>`. We deliberately avoid the Radix Select for
 * the settings page - native renders correctly inside the WP admin frame
 * and is fully a11y/keyboard-conformant out of the box.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ options, className, ...rest }, ref) => (
        <select
            ref={ref}
            className={cn(
                "flexa-seo-aeo-control",
                "fsa:h-9 fsa:rounded-md fsa:border fsa:border-slate-300 fsa:bg-white fsa:px-2 fsa:text-sm fsa:text-slate-900 fsa:shadow-sm fsa:transition-colors",
                "fsa:focus-visible:outline-none fsa:focus-visible:ring-2 fsa:focus-visible:ring-brand-500 fsa:focus-visible:ring-offset-1",
                "fsa:disabled:cursor-not-allowed fsa:disabled:opacity-60",
                className,
            )}
            {...rest}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    ),
);
Select.displayName = "Select";
