# PRD — Category secondary color, live preview chip and icon grid

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Category), [apps/admin/CONTEXT.md](apps/admin/CONTEXT.md) (Editor, Catalog). Rules: [AGENTS.md](AGENTS.md), [apps/api/AGENTS.md](apps/api/AGENTS.md), [apps/admin/AGENTS.md](apps/admin/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md), [ADR 0003](docs/adr/0003-database-admits-only-the-api.md), [ADR 0008](docs/adr/0008-curation-rules-live-in-the-admin-client.md).

**Follow the designed mockup: `.private/design-guildeline.png`** (filename spelled as on disk). The preview chip's reference is `.private/admin-preview-chips.svg`. Both are read-only: `.private/` is never modified.

## Decisions

### Domain

- The feature is on the **Category**, never the Theme: a Theme carries an image, and color and icon belong to its Category.
- A Category gains a **secondary color** beside its existing color. The existing `color` keeps its name everywhere (entity, column, contracts, admin, mobile): no `mainColor` anywhere in code or on the wire.
- The new field is `secondaryColor` in code and on the wire, `secondary_color` in the database.

### Schema

- `secondary_color`: varchar(7), NOT NULL, column default `'#ffffff'`, so existing Categories backfill to white.
- No new table, so no new grant or RLS snippet is needed.

### Contracts

- The admin Category response carries `secondaryColor` as a plain string, like `color`, so a stored value is served rather than refused.
- The admin Category write requires `secondaryColor`, with the same lowercase `#rrggbb` rule and message as `color`.
- `appCategorySchema` carries `secondaryColor` with the same lowercase hex regex as `color`. The phone receives it, but no mobile screen renders it in this PRD.

### API

- `/admin/categories` lists, creates and updates `secondaryColor`.
- The Category nested in `/app/themes` (and every other `/app` read serving `appCategorySchema`) carries `secondaryColor`, through the catalog repository's select and `ThemeVisuals`.

### Admin — Category form

- The layout follows the mockup:
  - Row 1: Name on the left, a « Preview » block on the right.
  - Row 2: « Main color » and « Secondary color » side by side.
  - Then Icon, Staging, the actions and the delete blocker, unchanged.
- « Main color » is a UI label only; it edits `color`.
- The Main color field keeps its `CategoryBadge` swatch. The Secondary color field reuses `ColorField`, with a plain swatch of the secondary color as its preview.
- Both fields share the same hex rule and the same « Not a #rrggbb color » hint.
- A new Category's form starts at color `#0ea5e9` (unchanged) and secondary color `#ffffff`.
- A change to `secondaryColor` makes the form dirty. Save is disabled until `secondaryColor` is a lowercase `#rrggbb`.
- A stored secondary color is lowercased into the form, the same as `color`.

### Admin — Preview chip

- The chip mirrors the app's Category chip from `.private/admin-preview-chips.svg`.
- It is rebuilt from plain HTML elements with classic `border-radius`: no SVG, no new library, no squircle, no backdrop blur.
- Geometry:
  - The outer pill is 35 px high, 13 px radius, filled with `secondaryColor`, and its width hugs the name.
  - The inner badge is 29 px square, inset 3 px, radius ~10 px, filled with `color`.
  - The icon is the MaterialIcons glyph at 20 px, with no rotation.
- Ink: the glyph and the name use the app's ink `#250313`, not zinc.
- The name is the typed name, uppercased, in **EpundaSlab**.
- EpundaSlab is copied from `apps/mobile/assets/fonts/EpundaSlab-Regular.ttf` into `apps/admin/public/fonts/` and wired with `next/font/local`, used by the chip alone. This is a deliberate local exception to the admin font rule: the chip previews the app.
- The chip updates live on every edit of name, color, secondary color and icon.
- Edge cases:
  - Empty name: the badge alone.
  - A name that is not a MaterialIcons icon: an empty badge.
  - A hex being typed but not yet valid: the chip keeps the last valid color, since `ColorField` only emits valid hex.
- The chip shows on the edit form and on the create form.

### Admin — Icon grid

- `suggestIcons` drops its limit: it returns every MaterialIcons name containing the query.
  - Names starting with the query rank first, then shorter names first (ranking unchanged).
  - An empty query returns every icon.
- The panel is a grid of glyph-only tiles styled after the mockup: square tiles, bordered, black glyph, no name text.
  - The panel has a fixed height (~175 px per the mockup), spans the field's width, and scrolls vertically when the matches overflow.
- Each tile shows its icon name through the native `title` attribute. No custom tooltip.
- The selected tile is the one whose name equals the field value exactly. Its background is the form's current `color` with hex alpha `40` (`${color}40`, ~25 %, the app's wash convention), following the color live.
- Behavior:
  - It opens on focus and click, and closes on blur (unchanged).
  - Picking a tile sets the value without the blur closing the panel mid-click (the existing `preventDefault` on mousedown).
- With zero matches, the panel shows no tiles, and the existing « No MaterialIcons glyph answers to that name. » hint stays under it. The « Not a MaterialIcons name yet » hint is unchanged.

### Test seams

- Contracts: `packages/contracts/src/admin/category.spec.ts` and `packages/contracts/src/app/theme.spec.ts`.
- API e2e with the stubbed data source: `apps/api/src/curation/_tests/admin-curation.e2e-spec.ts` and `apps/api/src/catalog/_tests/app-content.e2e-spec.ts`.
- Admin pure functions: `category-form.test.ts` and `icons.test.ts`.
- Admin components in happy-dom: prior art `components/theme-image.test.tsx`.

### Out of scope

- Any mobile screen rendering `secondaryColor`.
- Renaming `color`.
- A custom tooltip.
- Keyboard navigation inside the grid.
- Themes and Questions.
- Any API-side curation policy (ADR 0008).

## Items

```json
[
  {
    "category": "api",
    "description": "CategoryEntity carries secondaryColor: column secondary_color, varchar(7), NOT NULL, default '#ffffff'; color untouched",
    "steps": [
      "category.entity.ts declares secondaryColor with @Column({ type: \"varchar\", length: 7, name: \"secondary_color\", default: \"#ffffff\" }), in the entity's existing shape",
      "The color column's declaration is byte-identical to before",
      "No migration file is created or edited",
      "bun run check is green"
    ],
    "passes": false
  },
  {
    "category": "contracts",
    "description": "secondaryColor travels the wire: admin and app Category contracts, /admin/categories, the Category in /app/themes, and the admin category form state",
    "steps": [
      "adminCategoryResponseSchema accepts any stored secondaryColor string; adminCategoryWriteSchema refuses '#FFFFFF', '#fff', 'white' and '' for secondaryColor, accepts '#fff6e2'; specs prove both",
      "appCategorySchema requires a lowercase #rrggbb secondaryColor; theme.spec.ts proves acceptance and refusals",
      "admin-curation e2e: GET /admin/categories serves each Category's secondaryColor; POST and PATCH store and return it; a write with an invalid or missing secondaryColor is 400 with the ErrorResponse envelope",
      "app-content e2e: every Category in GET /app/themes carries its secondaryColor",
      "category-form.test.ts: blankCategoryForm has secondaryColor '#ffffff'; toCategoryForm lowercases a stored secondaryColor; a secondaryColor change makes the form dirty; categoryPayloadOf is null for an invalid secondaryColor and carries it when valid",
      "Every fixture across api, admin and mobile that builds a Category carries a secondaryColor",
      "bun run check is green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Category form follows the mockup's layout: Name beside a Preview slot, then Main color and Secondary color side by side",
    "steps": [
      "The Name field and a « Preview » labelled block share the first row, per .private/design-guildeline.png",
      "« Main color » (editing color, CategoryBadge swatch) and « Secondary color » (editing secondaryColor, plain swatch) sit side by side on the second row, each with its own « Not a #rrggbb color » hint",
      "A happy-dom component test: editing the Secondary color hex enables Save, and saving sends secondaryColor in the body",
      "bun run check is green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The Preview chip: EpundaSlab wired in the admin, the app's Category chip rebuilt in HTML, updating live on every edit",
    "steps": [
      "apps/admin/public/fonts/ holds EpundaSlab-Regular.ttf copied from apps/mobile/assets/fonts/, loaded with next/font/local and applied to the chip alone",
      "The chip matches .private/admin-preview-chips.svg: 35 px pill with 13 px radius filled with secondaryColor, 29 px badge inset 3 px with ~10 px radius filled with color, 20 px unrotated MaterialIcons glyph and uppercased name in #250313; no svg element, no new dependency",
      "A happy-dom component test: typing a name, changing color, secondary color and icon each updates the chip's text, background colors and glyph without saving",
      "Empty name renders the badge alone; an unknown icon name renders an empty badge",
      "The chip shows on both the create and the edit form",
      "bun run check is green"
    ],
    "passes": false
  },
  {
    "category": "admin",
    "description": "The icon picker becomes a fixed-height scrollable grid of every matching glyph, named by title, the selected tile washed in the form's color",
    "steps": [
      "icons.test.ts: suggestIcons('') returns every MaterialIcons name; suggestIcons('restaurant') returns every name containing it with 'restaurant' first; ranking of prefix-then-length unchanged",
      "The panel has a fixed height and scrolls; tiles show the glyph only, styled per .private/design-guildeline.png",
      "Each tile carries title equal to its icon name; no custom tooltip element",
      "A happy-dom component test: the tile whose name equals the field value has background `${color}40`, and it follows a color change live; no other tile is washed",
      "Picking a tile sets the field value; zero matches shows no tiles and the « No MaterialIcons glyph answers to that name. » hint",
      "bun run check is green"
    ],
    "passes": false
  }
]
```

## Human steps

- **After item 1, before any API deploy:** Hugo runs `bun run migration:generate` then `migration:run` in `apps/api`, and checks that the migration only adds `secondary_color` with its `'#ffffff'` default and leaves `color` untouched. No grant or RLS snippet is needed: `categories` already exists.
- **After item 5:** Hugo does a visual review of the Category form against `.private/design-guildeline.png`, and of the Preview chip against `.private/admin-preview-chips.svg`, in the running dashboard.
