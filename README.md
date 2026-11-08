# Romano Web — website

Marketing site for Romano Web, an independent digital studio. Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Motion.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Before launch

| What | Where |
| --- | --- |
| Real business email (shown on the site) | `src/config/site.ts` → `email` |
| Site address (canonical URLs, Open Graph) | Automatic on Netlify; override with `NEXT_PUBLIC_SITE_URL` |
| Contact form delivery | Netlify Forms, turned on in the Netlify dashboard (see Contact form below) |
| Concept projects → real case studies | `src/components/home/work.tsx` (`projects` array) |
| "Taking on new projects" label in the hero | `hero.meta` in `src/i18n/dictionaries.ts` (both languages) |

### Contact form

Messages go to [Netlify Forms](https://docs.netlify.com/manage/forms/setup/). No API key or email service needed.

**Setup (once, in the Netlify dashboard):**
1. Forms → Enable form detection, then redeploy. A form called `contact` appears.
2. Forms → Form notifications → Add notification → Email notification, and enter the address that should receive messages.

`public/__forms.html` tells Netlify which fields the form has. The real form (`src/components/contact/contact-form.tsx`) posts to it with JavaScript, so keep the field names in both files in sync. Sending only works on the deployed site, not with `npm run dev`.

**Protection:** no visible challenge or captcha.
- Hidden honeypot field (`website`), also checked by Netlify.
- The visitor must type or click in the form, and sending waits until it has been open at least 3 seconds. Bots that fail get a fake success.
- Netlify's own spam filter.

Validation runs in the browser (schema in `src/lib/contact-schema.ts`).

## Languages

The site is in English and Spanish:

| Page | English | Spanish |
| --- | --- | --- |
| Home | `/` | `/es` |
| Contact | `/contact` | `/es/contacto` |

- All copy lives in `src/i18n/dictionaries.ts`, one object per language. Change text there, not in the components.
- URLs per page are in `src/i18n/config.ts` (`paths`).
- Each language has its own root layout (`src/app/(en)` and `src/app/(es)`), so `<html lang>` is correct for each one. Switching language is a full page load.
- The EN / ES switch in the nav links to the same page in the other language. Pages declare `hreflang` alternates, and the sitemap lists both languages.
- Contact form errors are translated. Project type and budget values are always sent in English, with a `locale` field for the visitor's language.
- Unknown URLs show a bilingual 404 (`src/app/global-not-found.tsx`, which needs the `experimental.globalNotFound` flag in `next.config.ts`).

## Structure

```
src/
  app/(en), app/(es)    English and Spanish routes, each with its own root layout
  app/                  icon, robots, sitemap, bilingual 404
  i18n/                 languages, URL paths, all page copy
  config/site.ts        site-wide settings (name, owner, email, domain)
  components/
    ui/                 21st.dev components, adapted (halftone footer, scramble link)
    home/               homepage sections
    work/               device frames and illustrated concept screens
    contact/            contact form
    layout/             nav, footer, wordmark, grid guides
    motion/             Reveal, Magnetic, Parallax
  lib/                  form schema, utils
```

## Design system

Tokens live at the top of `src/app/globals.css`: background `#0B0B0B` / `#121212`, text `#F3F1EC`, muted `#929292`, accent `#FF5A36`, hairline borders `rgba(255,255,255,0.12)`. Type: Inter Tight (display and body) and JetBrains Mono (labels, metadata).

All motion respects `prefers-reduced-motion`. The canvases (hero field and footer) pause when off-screen.

### 21st.dev components

- **Halftone Wordmark Footer** by @kedhareswer: the canvas engine is unchanged. It was adapted to read Next.js font variables, use `next/link` for internal links, and respect reduced motion on back-to-top.
- **Scramble Link Button** by @hyperiux: used for nav links and CTAs. It now renders `next/link`, announces its label once to screen readers, and accepts an icon element so server components can use it.
