# AMO listing — English

Ready-to-paste texts for the addons.mozilla.org listing page.

---

## Name

```
MESH Dark Theme
```

---

## Summary (max 250 characters)

```
A dark theme for school.mos.ru: a clean UI, system-theme mode, 5 accent colors, auto-fix for legacy pages and image dimming.
```

---

## Description

**MESH Dark Theme** provides a carefully crafted dark mode for the Moscow
Electronic School (<https://school.mos.ru>).

Your diary, timetable and homework should not glare white late in the
evening. This extension turns the MESH interface dark — without inverting
images or applying crude filters that break the layout.

### How it works

MESH is built on the Lemma design system. The extension repaints its
semantic tokens — background, text, border, icon and state colors — so the
entire page becomes dark: cards, buttons, inputs, menus, grade badges,
modals and tooltips. Text stays high-contrast and status colors remain
distinguishable.

### Features

- **Three modes:** Dark, System (follows your OS) and Light.
- **Five accent colors:** indigo, blue, violet, green, magenta — the shared
  color of links, buttons and active elements.
- **Legacy page auto-fix.** If a section still renders light because it does
  not use tokens, the extension repaints its background and text.
- **Image and video dimming.** No glare on a dark background; brightness is
  restored on hover.
- **No flash.** The theme is applied before the first paint.
- **Sync.** Settings are shared across all `school.mos.ru` tabs.

### Privacy

The extension **collects no data**: no analytics, telemetry, ads or external
network requests. Theme settings are stored in your browser only. Access is
requested solely for `school.mos.ru`.

Privacy policy: add a link to your repository's `PRIVACY.md` in the AMO
"Privacy policy" field.

### Compatibility

- Firefox for desktop 140+
- Firefox for Android 142+

### Feedback

Found a light block the theme missed or a component conflict? Open an issue
with the MESH page link and a screenshot.

---

*This extension is unofficial and is not affiliated with the Moscow Department
of Education and Science or the MESH developers.*

---

## Category

- Primary: **Appearance**
- Secondary: **Education**, if available

---

## Tags

```
dark theme, dark mode, MESH, school.mos.ru, electronic diary, education, appearance, accessibility
```

---

## Permission justification

- `storage` — to save theme settings (mode, accent, image dimming) locally in
  the user's browser.
- `*://school.mos.ru/*` — to apply the dark theme on the Moscow Electronic
  School site only. No access to any other site.
