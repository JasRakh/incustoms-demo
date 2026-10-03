# InCustoms.AI — demo

Presentation build of the InCustoms.AI personal cabinet (individual user role). All data is mocked and stored in the browser's `localStorage`; no backend is required.

## Stack

- React 18 + TypeScript, Vite 5
- MUI 6, lucide-react icons
- React Router 6 (hash routing, so `dist/` can be hosted on any static server)

## Commands

```bash
npm install
npm run dev        # http://localhost:5180
npm run typecheck
npm run build      # output in dist/
npm run preview
```

## Structure

```
src/
  app/          store (state + toasts + notifications), i18n, navigation, routes
  components/
    layout/     sidebar, topbar, bottom nav, command palette, tour, Aziza widget
    common/     shared UI: page header, tabs, status chips, stepper, dropzone…
  data/mock.ts  initial demo data
  pages/
    dashboard/     action center ("Требует внимания", active applications, tasks)
    applications/  applications, dialogs (email/telegram/declarant), customs requests
    tools/         deal calculator (2 steps) and OCR → Excel
    aziza/         AI assistant chat with sources + tasks
    finance/       energy, contract invoices, payments, used services
    documents/     files list with search and filters
    help/          FAQ, courses, support form, onboarding tour
    declarant/     placeholder for the declarant (АИС) role
  theme/        MUI theme (light/dark, brand colors)
```

## Roles

The login screen and the user menu switch between **Физическое лицо** (implemented) and **Декларант** (placeholder with its own navigation, to be built on the same shell).

## Reset demo data

User menu → «Сбросить демо-данные».
