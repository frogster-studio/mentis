# PRD — Picker on the MainHeader, route files as pages

Vocabulary: [apps/mobile/CONTEXT.md](apps/mobile/CONTEXT.md) (Draw, Premium). Rules: [AGENTS.md](AGENTS.md), [apps/mobile/AGENTS.md](apps/mobile/AGENTS.md), [docs/agents/conventions.md](docs/agents/conventions.md).

## Decisions

### Route files

- A route file is the page itself: `export default function Page()` (`export default function Layout()` in every `_layout.tsx`, the root one included), `StyleSheet.create` styles at the bottom, nothing else in the file. A component inside a route file is always extracted.
- No route re-exports a `*Screen` any more: every `*-screen.tsx` that a route re-exports is inlined into its route and deleted. This covers every route in the app, not only the picker: `(tabs)` index and world, profile layout and its 3 pages, the 3 onboarding pages, competition, `session/[themeId]`, leaderboard, and the picker.
- `(tabs)/index.tsx` keeps its onboarding redirect inside `Page`.
- `play-screen` and `results-screen` are not routes. They are renamed in place to `play-view` / `results-view` (`PlayView`, `ResultsView`), so no `*-screen.tsx` file and no `*Screen` component remains in `src/`.
- A layout keeps only routing: the provider, the background, `<Tabs>` with its `Tabs.Screen` declarations, the header and the CTA. Any logic (a `tabBar` render with conditions, navigation params, selection state) lives in an imported component.
- The root layout's `RootNavigator` moves to `src/components/root-navigator.tsx`. Its fonts and splash logic stays in the root `Layout`, and only the signature changes.

### Component location

- A feature's components live in `src/components/<feature>/` (e.g. `src/components/quiz/`). `src/features/<feature>/` keeps the rest: api, constants, stores, hooks.
- `src/features/<feature>/components/` is legacy: nothing new is added to it. Moving its current content is out of scope.
- Every component file this PRD creates or rewrites wholesale goes in `src/components/<feature>/`. A file only renamed or lightly edited stays where it is.
- Cross-feature components go at the root of `src/components/`: `PlayerHeader`, `MainTabBar`, `RootNavigator`.

### Headers

- `MainHeader` is the frame. It owns the absolute positioning over the scenes, the top safe area, `PaperFade`, `StatusBar` and the bar card. It takes the bar content as `children` and the sub-header through a mandatory `subHeader: ReactNode` prop. It keeps its `isDark` prop and imports nothing from any feature.
- `MainSubHeader` keeps its scroll collapse (`useTabScrollY`, fixed full height of 170 collapsing to 0) and its content becomes `children`, bottom-anchored as today. Its title styling moves to the caller's content.
- `PlayerHeader` is the `(tabs)` header: the avatar, the greeting (or the pseudo + season points on Monde), the menu button, the `PseudoSheet`, and a `MainSubHeader` whose title follows the tab (`HOME_TITLE` / `WORLD_TITLE`). The greeting slot, which has state, may be its own component.
- `MainTabBar` holds the `(tabs)` tab-bar logic (dark and ink track on Monde, read off the tab state rather than the pathname).
- `ProfileHeader` is untouched: the profile look differs too much. Profile does not adopt `MainHeader`.

### Picker

- The routes move to `app/picker/(tabs)/_layout.tsx`, `index.tsx` and `custom.tsx`. The group is `(tabs)`, not `(_tabs)`. The URLs `/picker` and `/picker/custom` are unchanged.
- The picker adopts the MainHeader look wholesale: the bar at MainHeader geometry, the sub-header at 170 with `TEXT.mainSubHeaderTitle`. The picker's own geometry (`GUTTER`, `RADIUS.xl`, `TEXT.display`, `maxWidth`) goes away.
- Bar content: the `PRACTICE_TITLE` label, then the help button (still a no-op) and the close button (`leave`).
- Sub-header content: the title (`PICKER_TITLE` / `CUSTOM_PICKER_TITLE` per tab), the `PICKER_SUBTITLE` line under it on Classique, and the Premium crown stamp at the top right on Sur-mesure.
- The subtitle slot is reserved on both tabs, so the title sits at the same height on both. The subtitle and the stamp collapse with the sub-header.
- The header floats over the scenes like `(tabs)`: the picker layout wraps a `TabScrollProvider`. Scene content pads by `useMainHeaderHeight()` and scrolls under the header, and each tab publishes its offset via `useTabScroll()`.
- Classique is a `ScrollView` of the Draw's `ThemeCard`s. Loading and error states sit below the header. The bottom room for the swipe CTA stays.
- Sur-mesure is an empty `ScrollView` wired to `useTabScroll()`. Its content is out of scope.
- The `PaperFade` stays paper-coloured over the picker, even when a Theme is selected. The wash under the status bar is hidden by it, and this is accepted.
- The selection wash is painted once, by the layout (`PickerBackground` = paper + wash). The pages no longer use `ScreenContainer` at all.
- `PickerProvider` is a real component. It owns the selection, `leave` (barred back gestures) and the wash cross-fade, and `usePicker()` lives in the same file. It replaces `picker-context.ts`.
- `PickerTabBar` reads the context for the track colour: the Category colour, else `quiet`.
- `PickerStartButton` wraps `SwipableButton` and pushes `/session/[themeId]` with the exact params pushed today.
- Deleted: `picker-layout`, `picker-screen`, `custom-picker-screen`, `picker-context`.

### ScreenContainer

- `underlay: ReactNode` is removed and replaced by a mandatory `backdropColor: string | null`, painted as a flat colour over the paper and under the content.
- `play-view` passes `${categoryColor}${BACKDROP_ALPHA}`, and `theme-reveal` passes its Category colour at `40`.
- The profile pages stop painting `ProfileWash`, because the profile layout already paints it. Every other caller passes `null`.

### apps/mobile/AGENTS.md

- In Structure, `app/` reads: `app/  # expo-router routes — each route file writes its page itself; features hold the pieces`.
- In Structure, under `components/`: `components/<feature>/  # a feature's components; features/<feature>/components/ is legacy — new files never land there`.
- In Conventions, the `Screen *-screen.tsx → XxxScreen` naming is removed and replaced by this bullet, verbatim:

  > **A route file is the page itself** — `export default function Page()` (`Layout()` in `_layout.tsx`), styles at the bottom, nothing else in the file; never a re-exported `*Screen`. A layout keeps only routing — provider, background, `Tabs`, header, CTA — and imports every other piece.
  > ```tsx
  > // ✅ export default function Page() { … }
  > // ❌ export { PickerScreen as default } from "@/features/quiz/components/picker-screen";
  > ```

- Followed by this bullet, verbatim:

  > **A feature's components live in `src/components/<feature>/`**; `src/features/<feature>/` keeps the rest (api, constants, stores, hooks). Its `components/` folder is legacy, moved some day — never add to it.

- A component is still `export const X = () => {}`.

### Test seams

- No new pure logic, so no new vitest. `bun run check` green closes every item.
- Visual items are verified on the iOS simulator through the dev client: screenshots at rest and scrolled.

### Out of scope

- Moving the existing content of `src/features/<feature>/components/`.
- The profile header.
- Sur-mesure's content.
- The help button's action.
- A wash-aware fade.

## Items

```json
[
  {
    "category": "docs",
    "description": "apps/mobile/AGENTS.md states the route-file rule and the components/<feature> rule",
    "steps": [
      "Structure: app/ line and the new components/<feature>/ line read as in Decisions",
      "Conventions: the Screen *-screen.tsx → XxxScreen naming is gone; the two new bullets appear verbatim, the route-file one with its ✅/❌ example",
      "No other line of AGENTS.md changed; bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "MainHeader takes its bar as children and a subHeader slot; MainSubHeader takes children; the (tabs) content moves to PlayerHeader and MainTabBar",
    "steps": [
      "main-header.tsx and main-sub-header.tsx import nothing from src/features/",
      "(tabs)/_layout.tsx is export default function Layout() and imports PlayerHeader and MainTabBar from src/components/",
      "iOS simulator: Accueil shows the greeting and « Un peu d'entrainement ? »; Monde shows pseudo + points and its title, dark paper; scrolling either tab collapses the sub-header exactly as before",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The picker lives in app/picker/(tabs)/ as Layout/Page, its logic in src/components/quiz/, the wash painted once",
    "steps": [
      "app/picker/(tabs)/_layout.tsx, index.tsx, custom.tsx exist with the Layout/Page form; app/picker/ holds nothing else",
      "PickerProvider (with usePicker), PickerBackground, PickerTabBar, PickerStartButton live in src/components/quiz/; picker-layout, picker-screen, custom-picker-screen, picker-context are deleted",
      "The pages render no ScreenContainer and no SelectionWash; only PickerBackground paints the wash",
      "iOS simulator: the practice card opens /picker; selecting a Theme tints the page and the tab track; the swipe starts the session on that Theme; the close button leaves",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "PickerHeader is rebuilt on MainHeader + MainSubHeader, floating, its sub-header collapsing on scroll",
    "steps": [
      "PickerHeader lives in src/components/quiz/ and composes MainHeader and MainSubHeader; the old features/quiz/components/picker-header.tsx is deleted",
      "The picker layout wraps a TabScrollProvider; Classique and Sur-mesure are ScrollViews padded by useMainHeaderHeight() and wired to useTabScroll()",
      "iOS simulator at rest: MainHeader look; Classique shows « Sur quel thème ? » over the subtitle, Sur-mesure « Sur-mesure » with the crown stamp, both titles at the same height",
      "iOS simulator scrolled on Classique: the sub-header collapses to nothing, subtitle included, the Theme list scrolls under the header",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "ScreenContainer trades underlay for backdropColor",
    "steps": [
      "grep finds no underlay in src/",
      "play-view and theme-reveal pass their Category colour with its alpha; the profile pages no longer render ProfileWash; every other caller passes null",
      "iOS simulator: the Reveal and a Question show the Category backdrop as before; profile tabs show the wash once",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "(tabs)/index and world write their page in the route; home-screen and world-screen are deleted",
    "steps": [
      "Both files are export default function Page(); index still redirects to /onboarding before onboarding",
      "Any component extracted along the way lives in src/components/<feature>/",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The profile layout and its 3 pages are written in their routes; profile-tabs and profile-*-screen are deleted",
    "steps": [
      "profile/_layout.tsx is export default function Layout(); index, history, infos are export default function Page()",
      "ProfileHeader is unchanged",
      "bun run check green"
    ],
    "passes": true
  },
  {
    "category": "mobile",
    "description": "The 3 onboarding pages are written in their routes; their *-screen files are deleted",
    "steps": [
      "onboarding/index, quiz-session, end are export default function Page()",
      "Any component extracted along the way lives in src/components/onboarding/",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "competition, session/[themeId] and leaderboard are written in their routes; their *-screen files are deleted",
    "steps": [
      "The three files are export default function Page()",
      "Any component extracted along the way lives in src/components/<feature>/",
      "bun run check green"
    ],
    "passes": false
  },
  {
    "category": "mobile",
    "description": "The root layout is Layout() with RootNavigator extracted; play-screen and results-screen become play-view and results-view",
    "steps": [
      "app/_layout.tsx is export default function Layout(); RootNavigator lives in src/components/root-navigator.tsx",
      "PlayView and ResultsView are renamed in place in features/quiz/components/",
      "find src -name '*-screen.tsx' returns nothing; grep finds no exported *Screen component",
      "bun run check green"
    ],
    "passes": false
  }
]
```

## Human steps

- After item 4: on-device review of the picker header collapse on iOS and Android, and of how the paper fade reads over a selected Theme's wash.
- After item 10: read the `apps/mobile/AGENTS.md` diff.
