# cds-icon-button

Compact, icon-only buttons with a built-in tooltip. The common case is a clickable action affordance inside tables, toolbars, and row actions. Zooy also wires up Carbon's built-in toggle mode so a single button can flip between two states (favourite / unfavourite, pinned / unpinned, etc.) and dispatch the new state back to the panel.

Upstream: [Carbon Icon Button](https://web-components.carbondesignsystem.com/?path=/docs/components-icon-button--overview)

## Elements

| Element                    | Purpose                                                                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<cds-icon-button>`        | The button. Ships with a `<cds-tooltip>` in its shadow DOM, so tooltip content is built-in.                                                                            |
| `{% carbon_icon "name" %}` | Django tag from `django-zooy`. Renders an inline Carbon SVG. Defaults to `slot="icon"` so the SVG lands in Carbon's icon slot without every caller having to remember. |

Slots:

- `slot="icon"` — the SVG (or the icon-swap wrapper). Expected by Carbon; default for the `carbon_icon` tag.
- `slot="tooltip-content"` — plain text shown on hover / focus. Required for accessibility.

## Zooy integration

Defined in `src/ui/carbon/components/button.js`. Two distinct selectors route a `cds-icon-button` to different behaviour:

| Selector                             | Mode              | Panel event                                          | Event detail                                                         |
| ------------------------------------ | ----------------- | ---------------------------------------------------- | -------------------------------------------------------------------- |
| `cds-icon-button:not([data-toggle])` | Stateless click   | whatever the template sets via `event` on the button | all semantic attributes from the button                              |
| `cds-icon-button[data-toggle]`       | Toggle (stateful) | same — template's `event`                            | semantic attributes **plus** `isOn: <bool>` reflecting the new state |

In toggle mode, zooy does _not_ store state anywhere — it just flips Carbon's `isSelected` property on click and forwards the new value to the panel event. The panel decides what to persist.

**Key naming quirk:** `isSelected` is a reflected Lit property. `@carbon/web-components` doesn't set an explicit `attribute:` name on it, so Lit lowercases the property for the reflected attribute. The actual DOM attribute is `isselected` (no hyphen). Zooy's CSS in `src/sass/buttons.scss` selects on `cds-icon-button[isselected]`.

## Usage

### Simple action button

```django
<cds-icon-button event="refresh" kind="ghost">
  {% carbon_icon "renew" %}
  <span slot="tooltip-content">{% trans "Refresh" %}</span>
</cds-icon-button>
```

Click → panel receives `refresh` with `detail` containing the button's semantic attributes.

### Toggle, background tint only

```django
<cds-icon-button
    event="favorite_toggled"
    record-id="{{ item.pk }}"
    data-toggle
    kind="ghost">
  {% carbon_icon "favorite" %}
  <span slot="tooltip-content">{% trans "Favourite" %}</span>
</cds-icon-button>
```

Carbon's `kind="ghost"` renders a subtle background tint when `isSelected` is true; no other visual change. The panel receives `favorite_toggled` with `{isOn: true}` on one click and `{isOn: false}` on the next.

### Toggle with icon swap

Pass `toggle_to="..."` to the `carbon_icon` tag to render two icons — off-state and on-state — wrapped in `<span slot="icon" class="icon-toggle-wrapper">…</span>`. Zooy's CSS flips which one is visible based on `[isselected]`:

```django
<cds-icon-button
    event="favorite_toggled"
    record-id="{{ item.pk }}"
    data-toggle
    kind="ghost">
  {% carbon_icon "favorite" toggle_to="favorite--filled" %}
  <span slot="tooltip-content">{% trans "Favourite" %}</span>
</cds-icon-button>
```

Outline heart in the off state, filled heart in the on state.

### Toggle with colour swap

Add `data-toggle-color` to opt into a fill colour change when selected:

```django
<cds-icon-button
    event="favorite_toggled"
    record-id="{{ item.pk }}"
    data-toggle
    data-toggle-color
    kind="ghost">
  {% carbon_icon "favorite" %}
  <span slot="tooltip-content">{% trans "Favourite" %}</span>
</cds-icon-button>
```

When selected, the SVG `fill` switches to `var(--zoo-button-toggle-color)` (defaults to `var(--cds-link-primary, #0f62fe)` — Carbon link blue in the light theme). Override at `:root` in your app's theme to rebrand:

```scss
:root {
  --zoo-button-toggle-color: #d81b60; // hot pink
}
```

The icon-swap and colour-swap modes are orthogonal. Use neither, either, or both on the same button.

## Attributes

### Zooy semantic (light DOM, read by the renderer)

| Attribute                            | Required?             | Notes                                                                                                                                           |
| ------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `event`                              | yes (for interactive) | Panel event name to dispatch on click.                                                                                                          |
| `data-toggle`                        | —                     | Opt into toggle mode. Presence-only; no value.                                                                                                  |
| `data-toggle-color`                  | —                     | Opt into the colour-swap CSS rule. Presence-only; no value. Has no effect without `data-toggle` _and_ a slotted-icon SVG for the rule to reach. |
| `record-id`, `endpoint`, `action`, … | —                     | Any semantic attribute; forwarded into the event detail.                                                                                        |

### Carbon-native

| Attribute    | Values                                                                          | Notes                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`       | `primary` \| `secondary` \| `tertiary` \| `ghost` \| `danger` \| `danger-ghost` | `ghost` is the most common for icon-only buttons. Carbon's `cds--btn--selected` background tint is **gated on `kind="ghost"`** — other kinds still flip `isSelected` but won't draw a selected background. |
| `size`       | `sm` \| `md` \| `lg`                                                            | Button (and tooltip trigger) size.                                                                                                                                                                         |
| `align`      | `top` \| `right` \| `bottom` \| `left`                                          | Tooltip alignment.                                                                                                                                                                                         |
| `disabled`   | boolean                                                                         | Suppresses click handling and the toggle state flip.                                                                                                                                                       |
| `isSelected` | boolean, reflected as `isselected`                                              | You can set this server-side to render the button in the "on" state on first paint.                                                                                                                        |

## Caveats

1. **`slot="icon"` changes how Carbon paints the SVG.** This is the single most confusing gotcha. Carbon's icon-button shadow stylesheet contains this rule:

   ```css
   :host(cds-icon-button[kind="ghost"]) ::slotted([slot="icon"]) {
     color: var(--cds-icon-primary, #161616);
   }
   ```

   If your SVG has `slot="icon"`, its `color` is pinned to `--cds-icon-primary` (default near-black `#161616`), and since the Carbon SVG ships with `fill="currentColor"`, that's what the fill resolves to. If the SVG **doesn't** have `slot="icon"`, it falls into Carbon's default slot instead and inherits `color` via the flat tree from the inner `<button class="cds--btn--ghost">`, which has `color: var(--cds-link-primary, #0f62fe)` — Carbon link blue. Same icon, same button, two completely different default colours depending on one attribute.

   Neither is "wrong". `slot="icon"` is the idiomatic Carbon path and plays well with Carbon's sizing, positioning, and state rules for icons inside buttons. Dropping into the default slot is looser but gives you the blue look for free.

   `django-zooy`'s `carbon_icon` tag defaults to `slot="icon"` so the common case is consistent without every caller having to remember. If you specifically want the default-slot "blue by default" look for a one-off, opt out by passing an empty `slot`:

   ```django
   {% carbon_icon "launch" slot="" %}  {# goes into the default slot #}
   ```

   Theme-level fix: set `--cds-icon-primary` in your `:root` to whatever colour you want all slotted Carbon icons to be. Just remember it also affects every other Carbon icon site that reads the same token.

2. **The DOM attribute is `isselected`, not `is-selected`.** Carbon's `isSelected` Lit property reflects without an explicit attribute name, so Lit lowercases it. CSS and JS need to match: `cds-icon-button[isselected]` works, `cds-icon-button[is-selected]` doesn't.

3. **Colour swap collapses if `--zoo-button-toggle-color` equals the default icon colour.** The zooy rule is:

   ```css
   cds-icon-button[isselected][data-toggle-color] svg {
     fill: var(--zoo-button-toggle-color);
   }
   ```

   It overrides the unselected colour (which comes from `--cds-icon-primary` via Carbon's `::slotted([slot=icon])` rule). If you've themed both tokens to the same value, the "swap" visibly does nothing. This is the exact reason zooy split the token out — the old `--cds-icon-primary` reference silently collapsed the moment any consumer set that token. Pick two distinguishable values or let one of them use its default.

4. **Carbon only tints ghost buttons on select.** `cds--btn--selected` is gated on `kind === "ghost"` in Carbon's button source. A `data-toggle` button with `kind="primary"` will still flip `isSelected` and dispatch the event, but Carbon won't draw any built-in background change. If you need a selected state on a non-ghost button, draw it yourself.

5. **Submit buttons are routed separately.** A `<cds-icon-button type="submit">` inside a form is handled by the same `button.js` config but with a manual `form.requestSubmit()` on click, because Carbon's internal `<button>` lives in shadow DOM and breaks native form association. This is relevant only if you're tempted to mix `data-toggle` with `type="submit"` — don't; the two modes conflict.

6. **Tooltip content is a slot, not an attribute.** Use `<span slot="tooltip-content">…</span>`. If you omit it, the button has no accessible name — always set one.

## See also

- **`cds-button`** — text (and text+icon) buttons, wired via the same `src/ui/carbon/components/button.js` file.
- **`cds-combo-button`** — button + dropdown menu combo.
- **`cds-copy-button`** — specialised copy-to-clipboard button with feedback state.
- **`src/sass/buttons.scss`** — zooy-side styles for the toggle CSS and the `--zoo-button-toggle-color` token.
- **`django-zooy`'s `carbon_icon` template tag** — defaults `slot="icon"`, supports `toggle_to=` for icon-swap mode.
