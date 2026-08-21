/**
 * Extract translatable strings from the React admin app (`apps/admin/src`)
 * into a POT fragment.
 *
 * `wp i18n make-pot` uses a pure-ECMAScript parser (Peast) that chokes on
 * TypeScript syntax, so it cannot see the `__()` / `_x()` / `_n()` calls in
 * our `.tsx`/`.ts` sources. This script parses the same files with the
 * TypeScript compiler's own AST (already a dev dependency — no new tooling)
 * and emits a gettext POT the vanilla pipeline can `msgcat` into the main
 * `.pot`.
 *
 * The app routes every call through the local `@/lib/i18n` wrapper, whose
 * contract is "literal first argument only", so a static AST walk captures
 * 100% of the real strings. Non-literal arguments (e.g. the wrapper's own
 * parameter references in `lib/i18n.ts`) are skipped by design.
 *
 * Usage: node tools/i18n/extract-js.mjs <output.pot>
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC_DIR = path.join(PLUGIN_ROOT, "apps", "admin", "src");
const OUT = process.argv[2] || path.join(PLUGIN_ROOT, "i18n", "languages", "flexa-seo-aeo-js.pot");

/** Recursively collect .ts/.tsx files under a directory. */
function walk(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walk(full));
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

/** key => { msgctxt, msgid, msgid_plural, refs: Set } */
const entries = new Map();

function keyFor(ctx, id, plural) {
    return `${ctx ?? ""}${id}${plural ?? ""}`;
}

function record(ctx, id, plural, ref) {
    if (typeof id !== "string" || id === "") {
        return;
    }
    const key = keyFor(ctx, id, plural);
    let entry = entries.get(key);
    if (!entry) {
        entry = { msgctxt: ctx, msgid: id, msgid_plural: plural, refs: new Set() };
        entries.set(key, entry);
    }
    entry.refs.add(ref);
}

const literal = (node) =>
    node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;

for (const file of walk(SRC_DIR)) {
    const text = fs.readFileSync(file, "utf8");
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const rel = path.relative(PLUGIN_ROOT, file);

    const visit = (node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            // Identifier.text is the *unescaped* name; escapedText mangles a
            // leading `__` into `___`, which would miss every `__()` call.
            const name = node.expression.text;
            const args = node.arguments;
            const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
            const ref = `${rel}:${line}`;

            if (name === "__") {
                record(undefined, literal(args[0]), undefined, ref);
            } else if (name === "_x") {
                const id = literal(args[0]);
                const ctx = literal(args[1]);
                if (id !== undefined && ctx !== undefined) {
                    record(ctx, id, undefined, ref);
                }
            } else if (name === "_n") {
                const single = literal(args[0]);
                const plural = literal(args[1]);
                if (single !== undefined && plural !== undefined) {
                    record(undefined, single, plural, ref);
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
}

/** Escape a string for a PO msgid/msgstr. */
const esc = (s) =>
    s
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t");

const header =
    'msgid ""\n' +
    'msgstr ""\n' +
    '"Content-Type: text/plain; charset=UTF-8\\n"\n' +
    '"Content-Transfer-Encoding: 8bit\\n"\n' +
    '"X-Domain: flexa-seo-aeo\\n"\n';

const blocks = [];
for (const entry of [...entries.values()].sort((a, b) => (a.msgid < b.msgid ? -1 : 1))) {
    const lines = [];
    for (const ref of [...entry.refs].sort()) {
        lines.push(`#: ${ref}`);
    }
    if (entry.msgctxt !== undefined) {
        lines.push(`msgctxt "${esc(entry.msgctxt)}"`);
    }
    lines.push(`msgid "${esc(entry.msgid)}"`);
    if (entry.msgid_plural !== undefined) {
        lines.push(`msgid_plural "${esc(entry.msgid_plural)}"`);
        lines.push('msgstr[0] ""');
        lines.push('msgstr[1] ""');
    } else {
        lines.push('msgstr ""');
    }
    blocks.push(lines.join("\n"));
}

fs.writeFileSync(OUT, header + "\n" + blocks.join("\n\n") + "\n");
process.stderr.write(`Extracted ${entries.size} strings from ${path.relative(PLUGIN_ROOT, SRC_DIR)} → ${path.relative(PLUGIN_ROOT, OUT)}\n`);
