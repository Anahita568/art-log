# Art Log

A personal art cataloging tool: save pieces you've encountered, tag them
along independent axes (medium, movement, mood, color, subject), and filter
your collection by any combination of tags.

**Stack:** Spring Boot + GraphQL (backend), PostgreSQL (database), React +
TypeScript + Apollo Client (frontend).

<img src="docs/frontpage.png" alt="Art Log" width="600" />

## Architecture

```
React + Apollo Client  ──GraphQL (HTTP POST /graphql)──>  Spring for GraphQL
     (frontend)         ──REST (POST /api/images)─────>     (backend)
                                                                  │
                                                             Spring Data JPA
                                                                  │
                                                             PostgreSQL
```

- The frontend is a single-page app with no router: one page, a modal for
  artwork detail/edit, a modal for tag management. All server state goes
  through Apollo Client's cache; local UI state (the current filter, sort,
  which modal is open) is plain `useState` in `App.tsx`, passed down as
  props — there's no global state library because nothing here needs one.
- The backend exposes one GraphQL endpoint for all reads/writes, plus one
  plain REST endpoint (`POST /api/images`) for file uploads, since GraphQL
  isn't a natural fit for multipart file transport.
- Tags live in a single normalized table with a `type` column (`TagType`
  enum: MEDIUM, MOVEMENT, MOOD, COLOR, SUBJECT) rather than as separate
  fixed columns on `Artwork`. Adding a new axis later is a one-line enum
  change, not a schema migration touching every table and query.

## Backend

**Package layout** (`backend/src/main/java/com/artlog/artlog/`):

- `model/` — `Artwork`, `Tag`, `TagType`. Plain JPA entities; `Artwork.tags`
  is a `@ManyToMany` via an `artwork_tag` join table. `Artwork.setTags`
  defensively copies into a `HashSet` — Hibernate wraps whatever collection
  instance you hand it without copying, so an immutable `Set` passed in
  would blow up the first time anything tried to mutate it later.
- `repository/` — Spring Data repositories, plus `ArtworkSpecifications`:
  the composable tag-filtering logic. Each axis (`hasAnyTag(type, names)`)
  is a correlated `EXISTS` subquery, not a join on the main query — that
  keeps axes independent (AND across axes, OR within an axis) without
  colliding with each other or duplicating rows under pagination.
- `graphql/` — one `@Controller` per concern (`ArtworkQueryController`,
  `ArtworkMutationController`, `TagMutationController`), GraphQL input/
  payload records (`AddArtworkInput`, `UpdateArtworkInput`, `ArtworkPage`,
  etc.), and `GraphQlExceptionHandler`, which maps `IllegalArgumentException`
  (e.g. "a tag with that name already exists") to a GraphQL `BAD_REQUEST`
  error instead of a generic 500.
- `service/TagService` — find-or-create-on-the-fly tagging, tag rename
  (rejects a collision with another tag of the same name+axis), and tag
  delete (detaches the tag from every artwork that has it, rather than
  failing on the `artwork_tag` foreign key).
- `web/ImageUploadController` — a plain REST endpoint that validates the
  image type and hands the bytes to an `ImageStorage`, returning the
  absolute URL it gives back.
- `storage/` — `ImageStorage` and its two implementations, picked by
  `artlog.storage` (`IMAGE_STORAGE` env var): `LocalDiskImageStorage`
  (default; writes to `artlog.upload-dir` and serves `/uploads/**` itself —
  dev only, since deploy hosts don't keep a persistent filesystem) and
  `CloudinaryImageStorage` (configured by `CLOUDINARY_URL`).
- `admin/AdminToken` + `graphql/AdminTokenInterceptor` — visitors browse
  read-only; writes need the `ADMIN_TOKEN` secret in an `X-Admin-Token`
  header. The interceptor parses each GraphQL document and rejects it
  before execution if *any* operation in it is a mutation (not just the
  one `operationName` selects), so a mutation can't ride along with a
  query. It also sets an `isAdmin` context value, which the `isAdmin`
  query returns so the frontend can check a token. `ImageUploadController`
  checks the same token. With `ADMIN_TOKEN` unset, nobody can write.
- `config/WebConfig` — CORS, scoped to `http://localhost:*` so the frontend
  dev server can run on any port Vite picks.

**Filtering and pagination**: `ArtworkQueryController.artworks` takes a
filter, a sort, and page/pageSize, and composes a `Specification<Artwork>`
per request rather than hand-writing a query per filter combination. Tags
are deliberately **not** fetch-joined on the paged query (that would force
Hibernate to paginate in memory over the whole to-many join); instead,
`attachTags` batch-loads tags for just the current page's ids via a second
query and reattaches them in the original sorted order.

**GraphQL schema**: `backend/src/main/resources/graphql/schema.graphqls`.

**Tests** (`backend/src/test`): `ArtworkSpecificationsTest` covers the
AND/OR filter composition and search; `TagServiceTest` covers the rename-
collision and delete-reassociation logic. Both run against a real local
Postgres database (`artlog_test`), not H2 — Postgres-specific behavior
(the `oid`-vs-`text` column mapping, a Hibernate 6 join-fetch collision)
has already bitten this project twice, so fidelity mattered more than
speed. `AdminTokenInterceptorTest` sends real HTTP requests through
`/graphql` and checks that mutations without the token are rejected and
save nothing, while queries stay public. `AdminTokenTest`,
`ImageUploadControllerTest`, `LocalDiskImageStorageTest`, and
`CloudinaryImageStorageTest` (a malformed `CLOUDINARY_URL` must not leak
the API secret into logs) are plain unit tests (no database). Run with `mvn test`.

## Frontend

**Structure** (`frontend/src/`):

- `App.tsx` — top-level filter/sort state, single-column page layout.
- `components/FilterPanel` — tag checkboxes-turned-plain-text toggles,
  grouped by axis, plus a search box. Fetches available tags live via the
  `tags` query.
- `components/ArtworkGrid` / `ArtworkCard` — fetches the current page of
  artworks and renders cards; "Load more" appends subsequent pages.
- `components/ArtworkDetail` — a modal with the full artwork view, inline
  notes editing, and an "Edit details" mode that reuses `ArtworkForm`.
- `components/ArtworkForm` — the shared add/edit form (title, artist,
  year, image, tags-as-comma-separated-text-per-axis). Used by both
  `AddArtworkForm` and `ArtworkDetail`'s edit mode.
- `components/TagManager` — a modal for renaming/deleting tags, with a
  usage-count warning before deleting a tag that's still in use.
- `components/TagLabel` — a tag rendered as its axis's flat shape (square/
  circle/diamond/triangle/cross) plus its name; this is the one recurring
  visual motif, reused in cards, the detail view, and nowhere else trying
  to be clever.
- `apollo/client.ts`, `graphql/queries.ts`, `graphql/mutations.ts` —
  Apollo Client setup and all GraphQL documents in one place per concern.
- `uploadImage.ts` — posts a file to `/api/images`, returns the URL to
  store on the artwork.
- `adminToken.ts`, `useAdminAccess.ts` — the owner's token lives in this
  browser's `localStorage` and is attached to every request. "Owner sign
  in" (page footer) asks for it and keeps it only if the server's
  `isAdmin` query confirms it. Editing controls (add, edit, delete, Manage
  tags) render only when `isAdmin` is true. Hiding them is just UI; the
  backend enforces the actual access.

**Design**: plain black-on-white Helvetica, no borders or shadows, a
single accent color (`--accent`, neon blue) used only for primary actions.
Tokens live in `index.css`. There's deliberately no component-library/CSS-
framework dependency — this is a small enough surface that plain CSS per
component is easier to reason about than abstracting early.

**Tests**: `ArtworkForm.test.tsx`, via Vitest + React Testing Library,
covers the comma-separated tag-parsing behavior (trimming, dropping
empties, routing values to the right axis) through the rendered form
rather than exporting the private parsing function. Run with `npm test`.
Note: `vitest.config.ts` is kept separate from `vite.config.ts` — vitest
ships its own nested `vite` dependency, and mixing it with the top-level
`vite` + `@vitejs/plugin-react` in one config produces incompatible
plugin types.

## Local setup

**Requirements:** Java 21, Maven, Node, PostgreSQL 16.

### Database

```bash
docker compose up -d   # if Docker is available
```

Otherwise, install Postgres directly and create a matching role/database:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb artlog
psql -d artlog -c "CREATE ROLE artlog WITH LOGIN PASSWORD 'artlog';"
psql -d artlog -c "ALTER DATABASE artlog OWNER TO artlog;"
psql -d artlog -c "GRANT ALL ON SCHEMA public TO artlog;"
```

The app expects a database `artlog` at `localhost:5432`, role/password
`artlog`/`artlog` (override via `DB_USERNAME`/`DB_PASSWORD`). Tests expect
a second database, `artlog_test`, owned by the same role.

### Run

```bash
cd backend && mvn spring-boot:run   # http://localhost:8080/graphiql (with GRAPHIQL_ENABLED=true)
cd frontend && npm install && npm run dev   # http://localhost:5173 (or whatever port Vite picks)
```

Images go to `backend/uploads/` by default. To use Cloudinary instead,
`cp backend/.env.example backend/.env` and fill in `CLOUDINARY_URL` (from
the Cloudinary console, Settings → API Keys). The backend loads
`backend/.env` on startup; it's gitignored, and real env vars override it.

To edit locally, set `ADMIN_TOKEN` in `backend/.env`
(`openssl rand -base64 32`), then use "Owner sign in" at the bottom of the
page and paste it in.

On backend startup, Hibernate creates the schema (`ddl-auto: update`) and
`data.sql` seeds a starter set of tags.

### Test

```bash
cd backend && mvn test
cd frontend && npm test
```

## Deploy

Backend on **Render** (Docker, from `backend/Dockerfile`), database on
**Neon** (free Postgres that doesn't expire, unlike Render's free
databases), frontend on **Vercel**. Images already live in Cloudinary.

1. **Neon** — create a project, and copy the connection details from the
   dashboard. `DB_URL` must be the JDBC form,
   `jdbc:postgresql://<host>/<db>?sslmode=require`. Put the username and
   password in `DB_USERNAME`/`DB_PASSWORD`, not in the URL.
2. **Render** — New → Web Service from the GitHub repo, root directory
   `backend`, runtime Docker. Set the env vars:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
   - `IMAGE_STORAGE=cloudinary` and `CLOUDINARY_URL` (regenerate the
     secret first)
   - `ADMIN_TOKEN`: a fresh `openssl rand -base64 32`, not the dev one
   - `FRONTEND_ORIGIN_PATTERN`: the Vercel URL from step 3; update it
     once that's known

   Render sets `PORT` itself. On first boot, Hibernate creates the schema
   and `data.sql` seeds the tags. Free instances spin down when idle, so
   the first request after a while takes up to a minute.
3. **Vercel** — import the repo, root directory `frontend` (it detects
   Vite). Set `VITE_GRAPHQL_URI=https://<render-app>.onrender.com/graphql`
   and `VITE_API_ORIGIN=https://<render-app>.onrender.com`. They're baked
   in at build time, so changing them later needs a redeploy.
4. Set `FRONTEND_ORIGIN_PATTERN` on Render to the Vercel URL (e.g.
   `https://art-log.vercel.app`). Then open the site, use "Owner sign
   in" with the production `ADMIN_TOKEN`, and log a piece.

GraphiQL is off unless `GRAPHIQL_ENABLED=true` (set in the local `.env`).
The deployed database starts empty; local data stays local.

## Next steps

1. **Deploy** — follow [Deploy](#deploy) above. Nothing is live yet.
2. **Test coverage** — add tests alongside new mutations/components as
   they're touched, rather than another backfill pass; the current tests
   intentionally cover only the logic that's complex enough for a bug to
   be invisible by eye.
3. **Real data** — once deployed, actually log art you've seen.
4. **Multi-user accounts (later, if wanted)** — let anyone sign up and keep
   their own catalog. This replaces the single admin token. Likely shape:
   - A managed auth provider (Clerk/Auth0), with the backend as an OAuth2
     resource server validating its JWTs.
   - An `app_user` table, and a non-null `owner` on `Artwork` and `Tag`.
     Tags become unique per owner, so renaming one doesn't change anyone
     else's catalog.
   - Flyway migrations instead of `ddl-auto: update`.
   - Every query scoped by owner. Another user's ids behave like ids
     that don't exist.
   - Tests asserting that users can't see or change each other's data.
