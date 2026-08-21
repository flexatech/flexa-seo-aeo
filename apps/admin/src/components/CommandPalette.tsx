import {
    CornerDownLeft,
    ExternalLink,
    FileText,
    Network,
    Search,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { __ } from "@/lib/i18n";
import { useUiStore } from "@/lib/store";
import { SECTIONS, type SectionId } from "@/features/settings/sections";

interface Command {
    id: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    keywords: string;
    run: () => void;
}

/**
 * ⌘K / Ctrl-K command palette. Jumps to any settings section and opens the
 * public AEO endpoints. It portals to document.body (outside the themed
 * wrapper), so it renders on a white surface that stays legible under any WP
 * admin color scheme — the same trade-off the DangerZone dialog makes.
 */
export function CommandPalette() {
    const open = useUiStore((s) => s.paletteOpen);
    const setOpen = useUiStore((s) => s.setPaletteOpen);
    const [query, setQuery] = useState("");
    const [index, setIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const setActive = useUiStore((s) => s.setActiveSection);

    const commands = useMemo<Command[]>(() => {
        const home = window.flexaSeoAeo?.homeUrl ?? "/";
        const goto = (id: SectionId) => () => {
            setActive(id);
            setOpen(false);
        };
        const openUrl = (url: string) => () => {
            window.open(url, "_blank", "noopener");
            setOpen(false);
        };

        const navCommands: Command[] = SECTIONS.map((s) => ({
            id: `goto:${s.id}`,
            label: s.title,
            hint: __("Go to section"),
            icon: s.icon,
            keywords: `${s.title} ${s.subtitle}`.toLowerCase(),
            run: goto(s.id),
        }));

        const linkCommands: Command[] = [
            {
                id: "open:sitemap",
                label: __("View XML sitemap"),
                hint: __("Opens /sitemap.xml"),
                icon: Network,
                keywords: "sitemap xml crawl",
                run: openUrl(`${home}sitemap.xml`),
            },
            {
                id: "open:llms",
                label: __("View llms.txt"),
                hint: __("Opens /llms.txt"),
                icon: FileText,
                keywords: "llms ai answer engine aeo",
                run: openUrl(`${home}llms.txt`),
            },
        ];

        return [...navCommands, ...linkCommands];
    }, [setActive]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q === "") {
            return commands;
        }
        return commands.filter(
            (c) => c.label.toLowerCase().includes(q) || c.keywords.includes(q),
        );
    }, [commands, query]);

    // Global ⌘K / Ctrl-K toggle.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen(!useUiStore.getState().paletteOpen);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [setOpen]);

    // Reset transient state each time it opens; focus the input.
    useEffect(() => {
        if (open) {
            setQuery("");
            setIndex(0);
            const t = window.setTimeout(() => inputRef.current?.focus(), 0);
            return () => window.clearTimeout(t);
        }
        return undefined;
    }, [open]);

    // Keep the highlighted row in range as the filter narrows.
    useEffect(() => {
        setIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
    }, [filtered.length]);

    if (!open) {
        return null;
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setOpen(false);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndex((i) =>
                filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            filtered[index]?.run();
        }
    };

    return createPortal(
        <div
            className="fsa:fixed fsa:inset-0 fsa:z-[160002] fsa:flex fsa:items-start fsa:justify-center fsa:bg-slate-900/40 fsa:p-4 fsa:pt-[12vh]"
            onMouseDown={() => setOpen(false)}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={__("Command palette")}
                className="fsa:w-full fsa:max-w-lg fsa:overflow-hidden fsa:rounded-xl fsa:border fsa:border-slate-200 fsa:bg-white fsa:shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
            >
                <div className="fsa:flex fsa:items-center fsa:gap-2 fsa:border-b fsa:border-slate-100 fsa:px-4">
                    <Search
                        className="fsa:h-4 fsa:w-4 fsa:shrink-0 fsa:text-slate-400"
                        aria-hidden
                    />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={__("Jump to a section or action…")}
                        className="flexa-seo-aeo-bare-input fsa:h-12 fsa:w-full fsa:border-0 fsa:bg-transparent fsa:text-sm fsa:text-slate-900 fsa:outline-none fsa:placeholder:text-slate-400"
                    />
                    <kbd className="fsa:hidden fsa:rounded fsa:border fsa:border-slate-200 fsa:bg-slate-50 fsa:px-1.5 fsa:py-0.5 fsa:text-[10px] fsa:font-medium fsa:text-slate-500 fsa:sm:block">
                        ESC
                    </kbd>
                </div>

                <div className="fsa:max-h-80 fsa:overflow-y-auto fsa:p-2">
                    {filtered.length === 0 ? (
                        <div className="fsa:px-3 fsa:py-6 fsa:text-center fsa:text-sm fsa:text-slate-400">
                            {__("No matching commands.")}
                        </div>
                    ) : (
                        filtered.map((c, i) => {
                            const Icon = c.icon;
                            const isLink = c.id.startsWith("open:");
                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onMouseEnter={() => setIndex(i)}
                                    onClick={() => c.run()}
                                    className={cn(
                                        "fsa:flex fsa:w-full fsa:items-center fsa:gap-3 fsa:rounded-lg fsa:px-3 fsa:py-2.5 fsa:text-left fsa:cursor-pointer",
                                        i === index
                                            ? "fsa:bg-brand-50"
                                            : "fsa:bg-transparent",
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "fsa:flex fsa:h-8 fsa:w-8 fsa:shrink-0 fsa:items-center fsa:justify-center fsa:rounded-md",
                                            i === index
                                                ? "fsa:bg-brand-500 fsa:text-white"
                                                : "fsa:bg-slate-100 fsa:text-slate-600",
                                        )}
                                    >
                                        <Icon className="fsa:h-4 fsa:w-4" aria-hidden />
                                    </span>
                                    <span className="fsa:min-w-0 fsa:flex-1">
                                        <span className="fsa:block fsa:truncate fsa:text-sm fsa:font-medium fsa:text-slate-900">
                                            {c.label}
                                        </span>
                                        <span className="fsa:block fsa:truncate fsa:text-xs fsa:text-slate-500">
                                            {c.hint}
                                        </span>
                                    </span>
                                    {isLink ? (
                                        <ExternalLink
                                            className="fsa:h-3.5 fsa:w-3.5 fsa:shrink-0 fsa:text-slate-400"
                                            aria-hidden
                                        />
                                    ) : (
                                        i === index && (
                                            <CornerDownLeft
                                                className="fsa:h-3.5 fsa:w-3.5 fsa:shrink-0 fsa:text-brand-500"
                                                aria-hidden
                                            />
                                        )
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}
