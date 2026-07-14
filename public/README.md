# public/

Drop static assets here.

## Brand logo

The app ships with a hand-built SVG brand mark (`src/components/logo.tsx`,
`<GraveSignsMark />`) that renders crisply at any size, so nothing is required
here for the logo to appear.

To use the exact supplied artwork instead, save it as **`public/logo.png`** and
replace `<GraveSignsMark />` with a Next.js `<Image>` wherever the mark is used
(the site header, the hero, and the footer):

```tsx
import Image from "next/image";

<Image src="/logo.png" alt="GraveSigns" width={128} height={100} priority />
```
