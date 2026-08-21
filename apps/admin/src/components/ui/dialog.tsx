import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
    forwardRef,
    type ComponentPropsWithoutRef,
    type ElementRef,
    type HTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const DialogOverlay = forwardRef<
    ElementRef<typeof DialogPrimitive.Overlay>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fsa:fixed fsa:inset-0 fsa:z-[160001] fsa:bg-black/40 fsa:backdrop-blur-sm fsa:data-[state=open]:animate-in fsa:data-[state=closed]:animate-out fsa:data-[state=closed]:fade-out-0 fsa:data-[state=open]:fade-in-0",
            className,
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
    extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
    overlayClassName?: string;
}

export const DialogContent = forwardRef<
    ElementRef<typeof DialogPrimitive.Content>,
    DialogContentProps
>(({ className, overlayClassName, children, ...props }, ref) => (
    <DialogPrimitive.Portal>
        <DialogOverlay className={overlayClassName} />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "fsa:fixed fsa:left-1/2 fsa:top-1/2 fsa:z-[160002] fsa:grid fsa:w-full fsa:max-w-md fsa:-translate-x-1/2 fsa:-translate-y-1/2 fsa:gap-4 fsa:rounded-lg fsa:border fsa:border-slate-200 fsa:bg-white fsa:p-6 fsa:shadow-xl",
                "fsa:data-[state=open]:animate-in fsa:data-[state=closed]:animate-out",
                className,
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="fsa:absolute fsa:right-4 fsa:top-4 fsa:rounded-sm fsa:opacity-70 fsa:transition-opacity fsa:hover:opacity-100 fsa:focus:outline-none fsa:focus:ring-2 fsa:focus:ring-brand-500">
                <X className="fsa:h-4 fsa:w-4" />
                <span className="fsa:sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("fsa:flex fsa:flex-col fsa:space-y-1.5 fsa:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("fsa:flex fsa:justify-end fsa:gap-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

export const DialogTitle = forwardRef<
    ElementRef<typeof DialogPrimitive.Title>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn("fsa:text-lg fsa:font-semibold fsa:leading-none fsa:tracking-tight", className)}
        {...props}
    />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = forwardRef<
    ElementRef<typeof DialogPrimitive.Description>,
    ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("fsa:text-sm fsa:text-slate-500", className)}
        {...props}
    />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
