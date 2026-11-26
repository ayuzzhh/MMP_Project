# UI Changes (frontend only)

The backend, API, database, routes and business logic are **untouched**. All changes are in `frontend/`.

## 1. Removed the "Quick Login for Testing" option
- `frontend/src/pages/LoginPage.tsx`: removed the Citizen / Verification Admin / Super Admin quick-login box and its handler.
- `frontend/src/components/ProtectedRoute.tsx`: removed the matching "Prototype Evaluation: Switch to an Administrative Persona" box on the admin access-denied screen. It now shows a plain "Sign in with an administrator account" link to `/login`.

Not changed on purpose: `frontend/src/context/AuthContext.tsx` still auto-signs-in the default citizen account when no session exists. That is existing app behaviour (the map and wallet depend on it), so it was left alone. If you want it removed too, delete the `else { demoLogin('USER'); }` branch in the `useEffect` there.

## 2. UI improvements
- **Login and Register pages**: new split-screen layout (brand panel plus form), show/hide password toggle, proper label/input association, autofill attributes, loading spinner on the submit button, larger readable text. Same fields, same validation, same API calls.
- **New component** `frontend/src/components/AuthShell.tsx`: shared layout for the two pages above.
- **Navbar**: added a mobile menu (previously the nav links were hidden on small screens with no replacement).
- **Footer**: link hover colour now readable in light mode.
- **Global polish** (`index.css`, `tailwind.config.js`): defined the `animate-fade-in` animation (it was used across the app but never defined), smooth scrolling, visible keyboard focus outline, reduced-motion support.

## Files changed
- Modified: `LoginPage.tsx`, `RegisterPage.tsx`, `ProtectedRoute.tsx`, `Navbar.tsx`, `Footer.tsx`, `index.css`, `tailwind.config.js`
- Added: `components/AuthShell.tsx`, `UI_CHANGES.md` (this file)

## Verification
`tsc --noEmit` and `vite build` both pass. The original `README.md` is unchanged.

---

# Round 2: Editorial "civic studio" restyle (forest green, cream, ochre)

Matches the reference screenshots: deep forest green, warm cream paper, ochre accent, bold tight sans headlines, serif titles, monospace labels, hairline borders, crisp corners. Still frontend only; no logic, API or backend changes.

## Site-wide (via `frontend/tailwind.config.js`, `index.html`, `src/index.css`)
- Remapped the `slate`, `stone` and `gray` scales to a cream-to-forest ramp, and `emerald`/`amber` to forest green and ochre. Every existing page and modal picks up the new palette in light and dark mode without touching its code.
- Tighter corner radii (`xl`, `2xl`, `3xl`) for the crisper look.
- Serif font changed from Fraunces to Playfair Display; monospace "eyebrow" label style added.

## Rewritten / restyled
- `pages/LandingPage.tsx`: split hero (forest panel with large headline and Khasra search, illustrated village map on the right), numbered proof strip, four numbered checks in a hairline grid, a "village plot sheet" section styled like the master-plan reference, numbered steps, guarantee banner. All text content, links and the search behaviour are unchanged.
- `components/VillageSketch.tsx` (new): decorative SVG map of the sample plots (101, 102/1, 103, 104). It is an illustration, not live GIS data, and says so on the page.
- `components/Navbar.tsx`: cream bar, `e-stahl / land` wordmark, numbered centre links with ochre underline, forest "Sign Up" button.
- `components/AuthShell.tsx`: login and register brand panel updated to match.
- `pages/AboutPage.tsx`: background changed to the cream tone.

## Not changed
Map page, admin dashboard and modals keep their layouts and only inherit the new palette and radii.
