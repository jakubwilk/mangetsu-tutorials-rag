# Plan implementacji UI — Mangetsu Tutorials RAG

> Status: [ ] = do zrobienia, [x] = ukończone, [~] = w toku

---

## Faza 1 — Konfiguracja motywu i dark mode

**Pliki:** `src/app/layout.tsx`, `src/app/globals.css`

### Zadania

- [x] Wygenerować 10-odcieniową paletę dla koloru `#10718f` (wymagane przez Mantine)
- [x] Zarejestrować kolor własny w `createTheme({ colors: { mangetsu: [...] } })` i ustawić `primaryColor: 'mangetsu'`
- [x] Wymusić dark mode na poziomie `MantineProvider`: `forceColorScheme="dark"` (bez przełącznika)
- [x] Zaktualizować `ColorSchemeScript` z `defaultColorScheme="dark"`
- [x] Oczyścić `globals.css` — usunąć zmienne dla light mode, zostawić tylko dark base
- [x] Zaktualizować metadane (`title`, `description`) na właściwe dla projektu

**Uwaga:** Mantine wymaga tablicy 10 kolorów (shade 0–9). Kolor `#10718f` będzie na pozycji `[6]`.

---

## Faza 2 — Pliki statyczne `docs/`

**Pliki:** `docs/documents-info.md`, `docs/notices.json`

### Zadania

- [x] Utworzyć folder `docs/` w root projektu
- [x] Utworzyć `docs/documents-info.md` — markdown z opisem dokumentów dostępnych w bazie (placeholder content)
- [x] Utworzyć `docs/notices.json` — tablica obiektów z komunikatami

**Dlaczego notices jako JSON (nie .md)?**
Każdy komunikat potrzebuje `id` (do śledzenia odrzuconych w localStorage), `type` (info/warning) oraz `message`. Markdown nie daje tej struktury bez parsowania frontmatter — JSON jest tu czytelniejszy i prostszy.

**Format `notices.json`:**
```json
[
  {
    "id": "demo-notice",
    "type": "info",
    "message": "To jest wersja DEMO — funkcjonalność jest ograniczona."
  }
]
```

---

## Faza 3 — App Shell (szkielet layoutu)

**Pliki:** `src/app/layout.tsx`, nowe komponenty w `src/components/layout/`

### Zadania

- [x] Zaktualizować `src/app/layout.tsx` — uproszczony body (h-full overflow-hidden)
- [x] Utworzyć `src/components/layout/AppLayout.tsx` — Server Component, custom flexbox (zamiast Mantine AppShell — AppShell nie obsługuje natywnie vw + max-width dla offsets)
- [x] Utworzyć `src/components/layout/Topbar.tsx` — Server Component
  - Logo nieselektowalne po lewej (c="mangetsu.4"), przycisk forum po prawej
  - Wysokość: 60px, border-bottom
  - URL forum: `process.env.NEXT_PUBLIC_FORUM_URL`
- [x] Utworzyć `src/components/layout/ChatSidebar.tsx` — Client Component
  - Przycisk „Nowy czat", placeholder historii, licznik zapytań na dole
  - Szerokość: `20vw`, `maxWidth: 300px`
- [x] Utworzyć `src/components/layout/DocsPanel.tsx` — Client Component (react-markdown wymaga client)
  - Treść czytana serwerowo w `page.tsx`, przekazywana jako prop
  - Renderuje przez `Typography` (Mantine v9 odpowiednik TypographyStylesProvider) + `react-markdown`
  - Szerokość: `20vw`, `maxWidth: 300px`
- [x] Zaktualizować `src/app/page.tsx` — czyta `docs/documents-info.md`, renderuje AppLayout

**Układ:** `[Sidebar 20vw/max300px] | [Chat flex-1] | [DocsPanel 20vw/max300px]`

---

## Faza 4 — Panel czatu (główna treść)

**Pliki:** nowe komponenty w `src/components/chat/`, `src/app/page.tsx`

### Zadania

- [ ] Przepisać `src/app/page.tsx` — czysty wrapper, ładuje `ChatView`
- [ ] Utworzyć `src/components/chat/ChatView.tsx` — Client Component, główny kontener
- [ ] Utworzyć `src/components/chat/MessageList.tsx` — lista wiadomości ze scrollem
- [ ] Utworzyć `src/components/chat/MessageBubble.tsx` — bąbelki user/assistant
  - User: wyrównane do prawej, tło w kolorze primary, plain text
  - Assistant: wyrównane do lewej, tło neutralne, treść przez `react-markdown`
  - Animacja pojawiania się (Mantine `Transition`)
- [ ] Utworzyć `src/components/chat/ChatInput.tsx` — pole tekstowe + przycisk wyślij
  - `Textarea` z auto-resize (Mantine `autosize`)
  - Enter wysyła, Shift+Enter = nowa linia
  - Dezaktywacja podczas ładowania odpowiedzi
- [ ] Placeholder pusty czat — zachęta do wpisania pytania (widoczna gdy brak wiadomości)

---

## Faza 5 — System ogłoszeń (notices)

**Pliki:** `src/components/notices/NoticesPopover.tsx`, integracja w `Topbar.tsx`

### Zadania

- [ ] Utworzyć `src/components/notices/NoticesPopover.tsx` — Client Component
  - Czyta notices przez props (przekazane z Server Component który czyta `docs/notices.json`)
  - Ikona dzwonka (lub info) w topbarze z badge (liczba aktywnych)
  - Popover z listą aktywnych komunikatów
  - Każdy komunikat: przycisk X do odrzucenia (zapisuje id do `localStorage`)
  - Przycisk „Pokaż wszystkie" — czyści dismissed list z `localStorage`
- [ ] Utworzyć `src/app/notices-loader.ts` (Server Component helper) — czyta i parsuje `docs/notices.json`
- [ ] Integracja z `Topbar.tsx` — notices icon po prawej, obok przycisku forum

---

## Faza 6 — Powiadomienia systemowe (snackbary)

**Pliki:** `src/app/layout.tsx` (już skonfigurowane), `src/lib/notifications.ts`

### Zadania

- [ ] Skonfigurować Mantine `Notifications` — `position="top-center"`, `limit={3}`, `autoClose={5000}`
- [ ] Utworzyć `src/lib/notifications.ts` — helper funkcje `notifyError()`, `notifyInfo()`, `notifyWarning()` owijające `notifications.show()`
- [ ] Ostylować powiadomienia zgodnie z dark theme

---

## Faza 7 — Integracja i cleanup

### Zadania

- [ ] Podłączyć `session_id` (UUID z `localStorage`) do stanu czatu
- [ ] Podłączyć licznik zapytań do realnych danych (mock na start: `0/10`)
- [ ] Podłączyć listę historii czatów (z `localStorage` na start)
- [ ] Testy TypeScript — `tsc --noEmit`, zero błędów
- [ ] Usunąć wszystkie `console.log`, dead code, placeholder images Next.js
- [ ] Sprawdzić czy ESLint nie zgłasza błędów

---

## Decyzje — podjęte

| # | Pytanie | Decyzja |
|---|---------|---------|
| 1 | Renderowanie markdown | `react-markdown` — używane w docs panelu **i** w bąbelkach czatu (odpowiedzi AI) |
| 2 | Nazwa koloru w Mantine | `mangetsu` |
| 3 | Logo w topbarze | Tekst nieselektowalny (`user-select: none`) |

---

## Kolejność implementacji (rekomendowana)

```
Faza 1 → Faza 2 → Faza 3 → Faza 4 → Faza 5 → Faza 6 → Faza 7
```

Każda faza jest niezależna — można zatwierdzać i commitować po kolei.
