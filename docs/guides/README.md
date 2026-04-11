# Zooy Component Guides

Per-component documentation for Carbon components wired into zooy's panel event system. Each guide covers what the component is, how it's integrated into zooy, usage patterns for Django templates, and gotchas.

These guides are written for **template authors** in the consuming app (z2) — they document *how to use* components from HTML, not how zooy wires them internally. For architectural details see `CLAUDE.md` and `.claude/`.

## Conventions

Every guide follows the same structure:

1. **Overview** — what the component is, when to reach for it
2. **Elements** — the `<cds-*>` tags involved and what they do
3. **Zooy integration** — how zooy wires events into panels (selector, config shape, event name, what ends up in the event detail)
4. **Usage** — copy-pasteable Django template snippets for the common cases
5. **Attributes** — Carbon-native attributes relevant to template authors
6. **Caveats** — gotchas, things that look wrong but aren't, constraints imposed by Carbon or zooy
7. **See also** — related components, Carbon upstream docs

## Carbon components

### Buttons
- [cds-icon-button](./cds-icon-button.md) — icon-only button with tooltip, stateless click, and toggle mode (icon-swap + colour-swap)

### Lists
- [cds-contained-list](./cds-contained-list.md) — flat list with optional clickable items, header label, and action slot

<!-- Add new component guides here as they're wired in. -->

## Writing a new guide

When you add a new Carbon component to `src/ui/carbon/components/`, create a matching guide here. Use `cds-contained-list.md` as the template. Rules:

- Filename is the primary selector with `.md` (e.g. `cds-contained-list.md`, `cds-data-table.md`).
- Link it from the index above under the appropriate section.
- Show *Django template* snippets, not plain HTML — assume a `{% for %}` loop is the normal case.
- Always document whether the component is presentational or interactive, and what ends up in the panel event `detail`.
- Call out anything zooy can't enforce (e.g. Carbon attributes the template must set for the integration to work).
