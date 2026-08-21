import * as LabelPrimitive from "@radix-ui/react-label";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export const Label = forwardRef<
    HTMLLabelElement,
    ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(
            "fsa:text-sm fsa:font-medium fsa:leading-none fsa:text-slate-800 fsa:peer-disabled:cursor-not-allowed fsa:peer-disabled:opacity-70",
            className,
        )}
        {...props}
    />
));
Label.displayName = "Label";
