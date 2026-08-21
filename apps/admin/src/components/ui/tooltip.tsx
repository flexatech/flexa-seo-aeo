import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
    forwardRef,
    type ComponentPropsWithoutRef,
    type ElementRef,
} from "react";
import { cn } from "@/lib/cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
    ElementRef<typeof TooltipPrimitive.Content>,
    ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "fsa:z-[160003] fsa:overflow-hidden fsa:rounded-md fsa:bg-slate-900 fsa:px-2.5 fsa:py-1.5 fsa:text-xs fsa:font-medium fsa:text-slate-50 fsa:shadow-md fsa:animate-in fsa:fade-in-0 fsa:zoom-in-95 fsa:data-[state=closed]:animate-out fsa:data-[state=closed]:fade-out-0 fsa:data-[state=closed]:zoom-out-95 fsa:data-[side=bottom]:slide-in-from-top-1 fsa:data-[side=left]:slide-in-from-right-1 fsa:data-[side=right]:slide-in-from-left-1 fsa:data-[side=top]:slide-in-from-bottom-1",
                className,
            )}
            {...props}
        />
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;
