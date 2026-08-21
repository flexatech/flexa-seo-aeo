import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    checked: boolean;
    onCheckedChange: (next: boolean) => void;
}

/**
 * Minimal CSS-only toggle - no extra Radix package needed. The hidden input
 * is what the form/keyboard interacts with; the visual is two divs that
 * follow the `peer-checked:` state.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    ({ checked, onCheckedChange, className, disabled, id, ...rest }, ref) => {
        return (
            <label
                className={cn(
                    "fsa:relative fsa:inline-flex fsa:h-5 fsa:w-9 fsa:cursor-pointer fsa:items-center",
                    disabled && "fsa:cursor-not-allowed fsa:opacity-60",
                    className,
                )}
            >
                <input
                    ref={ref}
                    id={id}
                    type="checkbox"
                    role="switch"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onCheckedChange(e.target.checked)}
                    className="fsa:peer fsa:sr-only"
                    {...rest}
                />
                <span
                    aria-hidden
                    className="fsa:h-5 fsa:w-9 fsa:rounded-full fsa:bg-slate-300 fsa:transition-colors fsa:peer-checked:bg-brand-600 fsa:peer-focus-visible:ring-2 fsa:peer-focus-visible:ring-brand-500 fsa:peer-focus-visible:ring-offset-2"
                />
                <span
                    aria-hidden
                    className="fsa:absolute fsa:left-0.5 fsa:h-4 fsa:w-4 fsa:rounded-full fsa:bg-white fsa:shadow fsa:transition-transform fsa:peer-checked:translate-x-4"
                />
            </label>
        );
    },
);
Switch.displayName = "Switch";
