# cds-contained-list

Flat, bordered list with an optional header (label + action slot) and optional per-item icons and trailing actions. Items can be presentational or clickable. Useful for sidebars, detail panes, and any "list of things" that isn't tabular.

Upstream: [Carbon Contained List](https://web-components.carbondesignsystem.com/?path=/docs/components-contained-list--overview)

## Elements

| Element | Purpose |
|---|---|
| `<cds-contained-list>` | Container. Renders the header (if `label` is set or `[slot=label]` is present) and the `<ul>`. |
| `<cds-contained-list-item>` | A row. Renders as a `<div>` by default; renders as a `<button>` when the `clickable` attribute is set. |
| `<cds-contained-list-description>` | Optional descriptive text that sits inside an item. Presentational. |

## Zooy integration

Defined in `src/ui/carbon/components/lists.js`:

| Selector | Shape | Panel event | Event detail |
|---|---|---|---|
| `cds-contained-list` | presentational | — | — |
| `cds-contained-list-description` | presentational | — | — |
| `cds-contained-list-item` | `{ event: 'cds-contained-list-item-click', getData: (e, attrs) => attrs }` | whatever the template sets via the `event` attribute on the item | all semantic attributes read from the item |

Imports are mapped in `src/ui/carbon/imports.js` — all three selectors point to `@carbon/web-components/es/components/contained-list/index.js`, lazy-loaded the first time a panel contains any of them.

**How it flows:**
1. Carbon's `cds-contained-list-item` fires `cds-contained-list-item-click` (bubbling, composed) — but *only* when the item has the `clickable` attribute set.
2. Zooy's renderer sees the item's `event="..."` semantic attribute and attaches a `cds-contained-list-item-click` listener.
3. On click, zooy calls `panel.dispatchPanelEvent(eventName, attrs)` where `attrs` are all the semantic attributes read from the item (`record-id`, `endpoint`, `action`, etc.).

## Usage

### Basic (presentational)

```django
<cds-contained-list label="Services" kind="on-page">
  {% for service in services %}
    <cds-contained-list-item>{{ service.name }}</cds-contained-list-item>
  {% endfor %}
</cds-contained-list>
```

### Clickable items

```django
<cds-contained-list label="Customers" kind="on-page">
  {% for customer in customers %}
    <cds-contained-list-item
        clickable
        event="open_customer"
        record-id="{{ customer.pk }}"
        endpoint="{% url 'customer-detail' customer.pk %}">
      {{ customer.name }}
    </cds-contained-list-item>
  {% endfor %}
</cds-contained-list>
```

The panel receives `open_customer` with `detail` containing every semantic attribute from the item, e.g. `{event: "open_customer", recordId: "123", endpoint: "/customers/123/"}`.

### Header action

Put a button in the container's `action` slot to get a trailing header action:

```django
<cds-contained-list label="Tags" kind="on-page">
  <cds-icon-button slot="action" event="new_tag" align="left">
    <svg slot="icon">…</svg>
    <span slot="tooltip-content">Add tag</span>
  </cds-icon-button>

  {% for tag in tags %}
    <cds-contained-list-item clickable event="edit_tag" record-id="{{ tag.pk }}">
      {{ tag.name }}
    </cds-contained-list-item>
  {% endfor %}
</cds-contained-list>
```

### Item with icon and trailing action

```django
<cds-contained-list label="Files" kind="on-page">
  {% for file in files %}
    <cds-contained-list-item clickable event="open_file" record-id="{{ file.pk }}">
      <svg slot="icon">…</svg>
      {{ file.name }}
      <cds-icon-button
          slot="action"
          event="delete_file"
          record-id="{{ file.pk }}"
          align="left">
        <svg slot="icon">…</svg>
        <span slot="tooltip-content">Delete</span>
      </cds-icon-button>
    </cds-contained-list-item>
  {% endfor %}
</cds-contained-list>
```

The `action` slot on the item sits outside the clickable button in Carbon's shadow DOM, so clicking the trailing icon button dispatches `delete_file` without also triggering `open_file`.

### Custom label (slot)

Set the `label` attribute for plain text, or use `slot="label"` for rich content:

```django
<cds-contained-list kind="on-page">
  <div slot="label">
    <strong>Pinned</strong> <cds-tag type="blue">3</cds-tag>
  </div>
  …
</cds-contained-list>
```

## Attributes

### `<cds-contained-list>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `label` | string | `""` | Plain-text header label. Ignored if `[slot=label]` is present. |
| `kind` | `on-page` \| `disclosed` | `on-page` | Visual variant. `disclosed` is for lists inside cards/panels. |
| `is-inset` | boolean | `false` | Inset divider rules (indented, not full-bleed). |
| `size` | `xs` \| `sm` \| `md` \| `lg` \| `xl` | — | Row density. |

### `<cds-contained-list-item>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `clickable` | boolean | `false` | **Required** for the item to emit click events (and thus reach the panel). |
| `disabled` | boolean | `false` | Only meaningful with `clickable`. |
| `event` | string | — | Zooy semantic attribute — the panel event name to dispatch on click. |
| `record-id`, `endpoint`, `action`, etc. | string | — | Any zooy semantic attribute; forwarded to the panel event detail. |

## Caveats

1. **`clickable` is required on items to get events.** Without it, Carbon renders the item as a plain `<div>` and never fires `cds-contained-list-item-click`. Zooy's wrap config can't force this — templates must opt in. If a click "does nothing," check for `clickable` first.

2. **Items fire events even when the container has no `event`.** The event is per-item, not per-container. Different items in the same list can dispatch different panel events.

3. **Nested clickables don't collide (usually).** Carbon's `action` slot on items renders *outside* the clickable shadow button, so a trailing `cds-icon-button slot="action"` can have its own `event` without triggering the item's click. But anything inside the default slot *is* inside the button and will trigger both.

4. **Container is presentational.** Putting `event="..."` on `<cds-contained-list>` does nothing. Events only come from items (or from whatever you put in the header `action` slot).

5. **Lazy-loaded.** The Carbon module isn't in the initial bundle — it loads the first time a panel contains any contained-list element. No action needed from template authors, but note that it shows up in the Network tab on first use.

6. **No sort / filter / pagination built in.** This is a flat list. If you need any of that, use `cds-data-table` instead.

## See also

- **`cds-structured-list`** — Columnar rows with optional row selection, closer to a lightweight table. Supports multi-column headers; contained list does not.
- **`cds-list`** / **`cds-unordered-list`** / **`cds-ordered-list`** — Pure typography-level lists. No borders, no interactivity, no header. Use for prose lists inside body content.
- **`cds-data-table`** — Use when you need sorting, filtering, pagination, or DRF integration. See the DataBinder guide (pending).
