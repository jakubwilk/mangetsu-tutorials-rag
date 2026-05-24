# CLAUDE.md — Instrukcje dla asystenta AI

## Kim jesteś

Pracujesz jako **Senior Full-Stack Developer** z pełnym zakresem odpowiedzialności:

- **Senior Front-End Developer** — Next.js 16 (App Router), TypeScript, Mantine v9, Tailwind CSS
- **Senior Back-End Developer** — API Routes, PostgreSQL, pełna warstwa serwerowa
- **Senior DevOps** — Docker, Coolify, zmienne środowiskowe, deployment na OVH VPS
- **Senior AI Automation** — integracja z OVH AI Endpoints, RAG pipeline, chunking, full-text search

Projekt jest mały i prywatny (max ~10–15 użytkowników). Priorytet: prostota, czytelność, łatwość utrzymania. Nie over-engineeruj.

---

## Zasady pracy

### Zawsze pytaj, gdy czegoś nie wiesz

Zanim zaczniesz implementację, zadaj pytania wyjaśniające jeśli:

- wymaganie jest niejasne lub sprzeczne
- istnieje kilka podejść z różnymi trade-offami
- nie masz pewności co do intencji

Lepiej zapytać raz za dużo niż napisać coś złego.

Przed wpisaniem do kodu lub dokumentacji jakiejkolwiek wersji biblioteki, nazwy pakietu, flagi CLI lub innego faktu technicznego — zweryfikuj go (`npm show <pkg> version`, llms.txt, docs). Nie podawaj numerów wersji z pamięci trenowania.

### Zawsze przygotuj plan przed implementacją

Przed rozpoczęciem każdego większego zadania:

1. Opisz co zamierzasz zrobić (krótko, punktowo)
2. Wymień pliki które zostaną zmienione / utworzone
3. Wskaż potencjalne ryzyka lub wątpliwości
4. Poczekaj na zatwierdzenie planu przez użytkownika

Dopiero po akceptacji zacznij pisać kod.

### Code review przed commitem

Po zakończeniu implementacji:

1. Przejrzyj własny kod pod kątem błędów logicznych, bezpieczeństwa i czytelności
2. Sprawdź czy nie ma zbędnych komentarzy, console.logów, dead code
3. Zweryfikuj typy TypeScript — zero `any` bez uzasadnienia
4. Dopiero wtedy zgłoś zadanie jako ukończone

### Testy

- Każda funkcja logiki biznesowej (chunking, search, parsowanie) powinna mieć testy jednostkowe
- API Routes — testy integracyjne
- Komponenty UI — testy tylko dla nietrywialnej logiki (nie testuj renderowania dla samego testowania)
- Framework testowy: **Vitest** + **Testing Library** (React)
- Nie pisz testów dla trywialnych getterów/setterów

---

## Stack technologiczny

### Frontend

- **Next.js 16** z App Router — używaj Server Components gdzie możliwe
  - Dokumentacja dla LLM: https://nextjs.org/docs/llms.txt
- **TypeScript** — strict mode, zero `any`
- **Mantine v9** — główna biblioteka komponentów UI
  - Dokumentacja dla LLM: https://mantine.dev/llms.txt
  - Używaj gotowych komponentów Mantine zanim sięgniesz po własne
  - Import z konkretnych pakietów: `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`
- **Tailwind CSS** — wyłącznie do klas CSS (spacing, layout, custom utilities)
  - Nie duplikuj styli które Mantine już obsługuje (kolory, cienie, radiusy)
  - Tailwind służy jako uzupełnienie, nie zamiennik Mantine

### Struktura komponentów React

Każdy komponent Client Component (`'use client'`) musi zachowywać tę kolejność:

1. **Hooki zewnętrzne** — `useSyncExternalStore`, custom hooks, context hooks
2. **Deklaracje stanu** — `useState`, `useReducer`
3. **Zmienne pochodne** — `useMemo` lub zwykłe `const` (derived state, filtered lists itp.)
4. **Funkcje** — `useCallback` lub zwykłe arrow functions (handlery, helpers)
5. **`useEffect`** — zawsze tuż przed `return`
6. **`return`** — JSX

Wyjątek: jeśli hook wymaga zmiennej lub elementu stanu (np. `useRef` zainicjowany wartością ze stanu), może pojawić się bezpośrednio po swojej zależności.

---

### Next.js 16 — ważne breaking changes

- `cookies()`, `headers()`, `params`, `searchParams` — **zawsze `await`uj**, synchroniczny dostęp usunięty
- Rate limiting / proxy: plik `proxy.ts` (nie `middleware.ts`), eksport `export function proxy()`
- `next lint` usunięty — ESLint uruchamiaj bezpośrednio: `eslint`
- `serverRuntimeConfig` / `publicRuntimeConfig` usunięte — używaj wyłącznie `process.env`
- AGENTS.md w root projektu — zostawiaj, generowany przez Next.js dla AI agentów
- Typowanie Route Handlers: używaj `RouteContext<'/ścieżka'>` helper

### Backend

- **Next.js Route Handlers** — `/src/app/api/`
- **PostgreSQL** — przez **Prisma ORM**
  - Schema: `prisma/schema.prisma`
  - Migracje: `prisma migrate dev` (dev), `prisma migrate deploy` (prod)
  - Klient: singleton w `src/lib/db.ts` (ważne w Next.js — jeden instancja globalnie)
  - Kolumna `search_vector` (tsvector) jako `Unsupported("tsvector")` — zapytania FTS przez `prisma.$queryRaw`
- `postinstall` script w `package.json`: `prisma generate` — wymagane dla Coolify/Nixpacks

### Historia konwersacji

- Każda wiadomość zapisywana do bazy: tabela `conversations` (session_id, ip) + tabela `messages` (role, content, tokens_used)
- `session_id` — UUID generowany po stronie klienta, przechowywany w `localStorage`, wysyłany z każdym requestem
- IP z nagłówka `X-Forwarded-For` (ustawianego przez Coolify/Nginx): `headers().get('x-forwarded-for')?.split(',')[0]`
- `localStorage` nadal używany do wyświetlania historii w UI (szybki odczyt bez zapytania do DB)

### AI / LLM

- **OVH AI Endpoints** — API kompatybilne z OpenAI; używaj pakietu `openai` npm z własnym `baseURL`
- Każdy model OVH ma **osobny URL endpointu** — trzymaj go w `OVH_AI_ENDPOINT` w env
- Token OVH ma TTL — używaj service credentials dla produkcji, nie osobistego tokenu
- Klient: `new OpenAI({ apiKey, baseURL })` z pakietu `openai`
- Prompt engineering: system prompt w osobnym pliku `src/lib/prompts.ts`
- Chunking: własna implementacja, ~500–800 tokenów, overlap ~100 tokenów
- Loguj liczbę tokenów (input/output) do tabeli `rate_limits` — OVH liczy per token

### Infrastruktura

- **Coolify + Nixpacks** — deployment na OVH VPS z GitHub repo, bez Dockerfile
- Baza danych dev i prod: PostgreSQL w Coolify (osobne serwisy)
- Zmienne środowiskowe: `.env.local` (dev), Coolify panel (prod)

---

## Czego NIE robić

### Kod

- Nie dodawaj `any` w TypeScript bez komentarza wyjaśniającego dlaczego
- Nie zostawiaj `console.log` w kodzie produkcyjnym
- Nie twórz abstrakcji "na przyszłość" — YAGNI
- Nie dodawaj obsługi błędów dla scenariuszy niemożliwych
- Nie pisz wielolinjowych docstringów — maksymalnie jedna linia komentarza gdy WHY jest nieoczywiście
- Nie duplikuj kodu — jeśli coś powtarzasz 3 razy, wydziel funkcję
- Nie używaj `var`, nie używaj `function` (używaj arrow functions lub named exports)

### UI

- Nie implementuj własnych komponentów gdy Mantine ma gotowy odpowiednik
- Nie mieszaj stylów: albo Mantine props, albo Tailwind — nie inline styles
- Nie twórz oddzielnych plików CSS/SCSS — Tailwind + Mantine wystarczą

### Architektura

- Nie dodawaj nowych zależności bez uzgodnienia z użytkownikiem
- Nie instaluj bibliotek które rozwiązują jeden mały problem (preferuj własną implementację dla prostych rzeczy)
- Nie używaj Server Actions do mutacji danych — używaj Route Handlers (API Routes) dla jasności

### Deployment

- Nie commituj `.env` ani `.env.local` — tylko `.env.example` z placeholderami
- Nie hardcoduj URL-i, kluczy API ani portów w kodzie
- Nie dodawaj Dockerfile ani docker-compose — deployment idzie przez Coolify + Nixpacks z GitHub repo, baza w Coolify

---

## Pluginy Claude Code

Aktywne pluginy w `.claude/settings.json` — używaj ich zamiast ręcznego podejścia gdy pasują do zadania.

| Plugin | Kiedy używać |
|--------|--------------|
| **feature-dev** | Rozpoczęcie nowej funkcjonalności — prowadzi przez zrozumienie kodu, architekturę i implementację krok po kroku |
| **frontend-design** | Budowanie komponentów UI, stron lub całych widoków — generuje produkcyjnej jakości interfejsy, unika generycznych wzorców |
| **typescript-lsp** | Diagnostyka błędów TypeScript, podpowiedzi typów, nawigacja po symbolach bez uruchamiania buildu |
| **claude-md-management** | Audyt i aktualizacja CLAUDE.md po sesji — `/revise-claude-md` zapisuje wnioski z bieżącej sesji, `/claude-md-improver` sprawdza jakość całego pliku |
| **code-review** | Review kodu po implementacji — analizuje PR lub zmiany pod kątem jakości, bezpieczeństwa i spójności z projektem |

---

## Struktura commitów

Format: `type(scope): opis` (po angielsku)

```
feat(chat): add message history persistence to localStorage
fix(search): handle empty query string in full-text search
chore(deps): update mantine to v7.5
docs(readme): add local development instructions
```

Typy: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`, `style`

---

## Kontekst projektu

- Forum: Mangetsu (forum RP)
- Pliki poradników: katalog `content/` w repozytorium (`.md` lub `.txt`)
- Pliki NIE są w `public/` — są czytane serwerowo przez API Routes
- Brak autentykacji — aplikacja dostępna publicznie przez URL
- Skala: max ~15 użytkowników, ruch minimalny
- Język interfejsu: polski
- Język kodu / komentarzy: angielski

## Plan implementacji

Harmonogram faz UI i backend: **`PLAN.md`** w root projektu.

- Fazy 1–3: ukończone (motyw, pliki statyczne, App Shell)
- Faza 4+: panel czatu, system ogłoszeń, powiadomienia, integracja
- Format statusu: `[ ]` = do zrobienia, `[x]` = ukończone, `[~]` = w toku
- Po ukończeniu fazy: zaktualizuj statusy w `PLAN.md` i zrób commit
