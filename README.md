# Mangetsu Tutorials RAG

Prywatna aplikacja webowa do przeszukiwania poradników z forum Mangetsu przy użyciu LLM. Użytkownik zadaje pytania w języku naturalnym, aplikacja wyszukuje odpowiednie fragmenty poradników i zwraca odpowiedź wygenerowaną przez model językowy.

## Funkcjonalności

- Interfejs czatu do zadawania pytań dotyczących poradników
- Pseudo-RAG: fragmentacja plików tekstowych → wyszukiwanie full-text w PostgreSQL → kontekst do LLM
- Historia konwersacji przechowywana w `localStorage` przeglądarki (bez backendu)
- Brak uwierzytelniania — aplikacja dostępna dla każdego znającego URL
- Pliki poradników zarządzane bezpośrednio w kodzie źródłowym (katalog `content/`)

## Stack technologiczny

| Warstwa     | Technologia                                          |
| ----------- | ---------------------------------------------------- |
| Frontend    | Next.js 15 (App Router), TypeScript                  |
| UI          | Mantine v7, Tailwind CSS                             |
| Backend     | Next.js API Routes (Server Actions / Route Handlers) |
| Baza danych | PostgreSQL (full-text search: `tsvector`/`tsquery`)  |
| LLM         | OVH AI Endpoints                                     |
| Hosting     | OVH VPS → Coolify → Docker                           |

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

Przechowywana wyłącznie w `localStorage` — zero danych użytkownika na serwerze. Każda sesja to osobna lista wiadomości.

## Struktura projektu

```
mangetsu-tutorials-rag/
├── content/                  # Pliki poradników (markdown/txt)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Główny interfejs czatu
│   │   └── api/
│   │       ├── chat/route.ts # Obsługa zapytań do LLM
│   │       └── seed/route.ts # Seeding bazy danych z plików
│   ├── components/
│   │   └── Chat/             # Komponenty czatu
│   ├── lib/
│   │   ├── db.ts             # Klient PostgreSQL
│   │   ├── chunker.ts        # Logika fragmentacji plików
│   │   ├── search.ts         # Full-text search
│   │   └── llm.ts            # Klient OVH AI Endpoints
│   └── types/
├── docker-compose.yml        # Lokalny development (Postgres)
├── Dockerfile
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
