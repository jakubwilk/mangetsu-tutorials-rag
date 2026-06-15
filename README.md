# Mangetsu Tutorials RAG

Prywatna aplikacja webowa do przeszukiwania poradników z forum Mangetsu przy użyciu LLM. Użytkownik zadaje pytania w języku naturalnym, aplikacja wyszukuje odpowiednie fragmenty poradników i zwraca odpowiedź wygenerowaną przez model językowy.

## Funkcjonalności

- Interfejs czatu do zadawania pytań dotyczących poradników
- Pseudo-RAG: fragmentacja plików tekstowych → wyszukiwanie full-text w PostgreSQL → kontekst do LLM
- Historia konwersacji zapisywana w PostgreSQL (audit, debugowanie błędów)
- Identyfikacja sesji przez UUID generowany po stronie klienta (`localStorage`) + IP użytkownika
- Brak uwierzytelniania — aplikacja dostępna dla każdego znającego URL
- Pliki poradników zarządzane bezpośrednio w kodzie źródłowym (katalog `content/`)

## Stack technologiczny

| Warstwa     | Technologia                                         |
| ----------- | --------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), TypeScript                 |
| UI          | Mantine v9, Tailwind CSS                            |
| Backend     | Next.js Route Handlers                              |
| Baza danych | PostgreSQL (full-text search: `tsvector`/`tsquery`) |
| LLM         | OVH AI Endpoints                                    |
| Hosting     | OVH VPS → Coolify + Nixpacks                        |

## Architektura

```
content/
  poradnik-1.md
  poradnik-2.md
  ...

Przy starcie / seeding:
  Odczyt plików → chunking → zapis chunków do PostgreSQL (tsvector)

Na zapytanie użytkownika:
  Pytanie → PostgreSQL full-text search → top N chunków → prompt do LLM → odpowiedź
```

### Katalog `content/`

Pliki poradników (`.md` lub `.txt`) trzymane bezpośrednio w repozytorium. **Nie trafiają do `public/`** — są dostępne wyłącznie po stronie serwera przez API Routes. Dodanie nowego poradnika = dodanie pliku + `git push` + redeploy (lub ręczny seed).

### Chunking

Pliki dzielone na fragmenty (~500–800 tokenów z overlapem ~100 tokenów). Każdy chunk trafia do tabeli `chunks` z kolumną `tsv tsvector` indeksowaną GIN.

### Full-text search

PostgreSQL `to_tsquery` z konfiguracją `polish` (lub `simple` jeśli problemy z polskim słownikiem). Top N chunków (domyślnie 5) przekazywanych jako kontekst do LLM.

### Historia czatu

Każda wiadomość zapisywana do PostgreSQL. Tabela `conversations` przechowuje `session_id` (UUID generowany w `localStorage` przy pierwszej wizycie) oraz IP użytkownika (z nagłówka `X-Forwarded-For`). Tabela `messages` przechowuje pojedyncze wiadomości z rolą (`user`/`assistant`) i liczbą tokenów.

`localStorage` nadal używany do szybkiego wyświetlania historii w UI — baza danych służy do audytu i debugowania błędów.

## Struktura projektu

```
mangetsu-tutorials-rag/
├── content/                        # Pliki poradników (markdown)
├── docs/                           # Pliki statyczne: notices.json, documents-info.md
├── prisma/                         # Schema i migracje Prisma ORM
├── scripts/                        # Skrypty pomocnicze (seed)
├── src/
│   ├── app/
│   │   ├── page.tsx                # Główna strona (Server Component)
│   │   ├── layout.tsx              # Root layout z MantineProvider
│   │   └── api/
│   │       ├── chat/route.ts       # POST /api/chat — RAG pipeline
│   │       ├── sessions/route.ts   # GET /api/sessions — walidacja sesji
│   │       └── rate-limit/route.ts # GET /api/rate-limit — licznik zapytań
│   ├── modules/
│   │   ├── common/                 # Współdzielone komponenty layoutu i utility
│   │   │   ├── api/sources.ts      # Webhook — dodawanie źródeł
│   │   │   ├── components/         # AppLayout, Topbar, ChatSidebar, DocsPanel, ...
│   │   │   ├── data/               # loading-messages.json
│   │   │   └── utils/notifications.ts
│   │   ├── chat/                   # Moduł czatu
│   │   │   ├── api/                # Klienty HTTP: handler, sessions, rate-limit
│   │   │   ├── components/         # ChatView, ChatInput, MessageList, MessageBubble
│   │   │   ├── store/              # Stan czatu (external store)
│   │   │   └── types/
│   │   ├── notices/                # System ogłoszeń
│   │   │   ├── api/loader.ts       # Czyta docs/notices.json
│   │   │   ├── components/         # NoticesPopover
│   │   │   └── store/              # Stan odrzuconych ogłoszeń (localStorage)
│   │   └── search/                 # FTS + hybrid search
│   │       └── utils/              # chunker.ts, search.ts
│   ├── server/
│   │   ├── ai/                     # Klient OVH AI Endpoints + embeddingi
│   │   ├── db/                     # Singleton Prisma Client
│   │   └── prompts/                # System prompt dla LLM
│   └── generated/prisma/           # Auto-generowane typy Prisma
├── .env.example
└── CLAUDE.md
```

## Uruchomienie lokalne

```bash
# 1. Skopiuj zmienne środowiskowe
cp .env.example .env.local

# 2. Uruchom PostgreSQL
docker compose up -d postgres

# 3. Zainstaluj zależności
pnpm install

# 4. Zaindeksuj poradniki
curl -X POST http://localhost:3000/api/seed

# 5. Uruchom dev server
pnpm dev
```

## Zmienne środowiskowe

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mangetsu_rag
OVH_AI_ENDPOINT=https://...
OVH_AI_API_KEY=...
OVH_AI_MODEL=...
```

## Deployment (Coolify)

1. Połącz repozytorium z Coolify
2. Ustaw zmienne środowiskowe w panelu Coolify
3. Coolify buduje obraz Docker i uruchamia kontener
4. Postgres jako oddzielna usługa w Coolify lub zewnętrzna instancja OVH

## Skalowalność

Aplikacja projektowana na **maksymalnie kilkanaście użytkowników**. Nie wymaga cache'owania, kolejkowania ani złożonej infrastruktury. W razie potrzeby rozszerzenia o embeddings/pgvector — baza Postgres jest już na miejscu.
