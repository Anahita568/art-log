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
speed. `ImageUploadControllerTest`, `LocalDiskImageStorageTest`, and
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
cd backend && mvn spring-boot:run   # http://localhost:8080/graphiql
cd frontend && npm install && npm run dev   # http://localhost:5173 (or whatever port Vite picks)
```

Images go to `backend/uploads/` by default. To use Cloudinary instead,
`cp backend/.env.example backend/.env` and fill in `CLOUDINARY_URL` (from
the Cloudinary console, Settings → API Keys). The backend loads
`backend/.env` on startup; it's gitignored, and real env vars override it.

On backend startup, Hibernate creates the schema (`ddl-auto: update`) and
`data.sql` seeds a starter set of tags.

### Test

```bash
cd backend && mvn test
cd frontend && npm test
```

## Next steps

1. **User accounts** — the deployed app should let anyone sign up and keep
   their own catalog. Today everything is global: any visitor could read,
   edit, or delete every artwork and tag, and upload to the Cloudinary
   account. This has to land before the app gets a public URL.

   - **Auth approach (open decision).** Leaning toward a managed provider
     (Clerk or Auth0): it handles sign-up, login, password reset, and
     email verification, and the backend only validates the JWT it
     issues (Spring Security as an OAuth2 resource server, a few lines of
     config). Bearer tokens also sidestep the cross-site cookie problems
     of a Vercel frontend talking to a Render/Railway backend. The
     alternatives: Spring Security with our own email/password (BCrypt,
     sessions, plus building reset and verification emails ourselves), or
     "Sign in with GitHub/Google" via Spring's `oauth2Login` (no passwords
     stored, but session cookies across two domains need the frontend
     host to proxy API requests).
   - **Data model.** An `app_user` table keyed by the auth provider's user
     id. `Artwork` and `Tag` each get a non-null `owner`. Tags become
     per-user, unique on `(owner, name, type)` instead of `(name, type)`,
     because renaming or deleting a shared tag would change everyone
     else's catalog. The starter tags in `data.sql` move to being created
     for each user on first sign-in.
   - **Migrations.** Adding non-null owner columns to tables that already
     have rows is beyond what `ddl-auto: update` can do safely, and once a
     database is deployed, schema changes need to be deliberate. Add
     Flyway now: a baseline migration for the current schema, then one
     for ownership. Switch Hibernate to `ddl-auto: validate`.
   - **Scoping every read and write.** Resolve the current user once per
     request. Add an `ownedBy(user)` specification and AND it into every
     artwork query. Replace `findById` with `findByIdAndOwner`, so another
     user's ids behave exactly like ids that don't exist and existence
     doesn't leak. Scope `TagService` (find-or-create, rename collision,
     delete) to the owner. `POST /api/images` requires a signed-in user.
   - **Frontend.** Sign-in/sign-out UI and a signed-out landing state.
     Attach the token to the Apollo link and to `uploadImage`.
   - **Tests.** The invariant that matters is isolation: user A can't
     read, edit, or delete user B's artworks or tags, and two users can
     each have a tag named "Blue" without colliding. Extend
     `ArtworkSpecificationsTest` and `TagServiceTest` with a second user.
2. **Deploy prep** — small config changes the hosts need:
   - `server.port: ${PORT:8080}` (Render and Railway assign the port).
   - `spring.datasource.url: ${DB_URL:jdbc:postgresql://localhost:5432/artlog}`.
     Hosts hand out `postgresql://user:pass@host/db` URLs, which need
     rewriting to `jdbc:postgresql://host:5432/db` with the username and
     password set separately.
   - GraphiQL off unless enabled by an env var.
   - A `Dockerfile` for the backend if deploying to Render (it has no
     native Java runtime). Railway builds Maven projects directly.
   - Regenerate the Cloudinary API secret before setting it on the host.
3. **Deploy** — backend → Render/Railway with a managed Postgres instance;
   frontend → Vercel/Netlify. Backend env: `DB_URL`, `DB_USERNAME`,
   `DB_PASSWORD`, `FRONTEND_ORIGIN_PATTERN` (the frontend's deployed
   URL), `IMAGE_STORAGE=cloudinary`, `CLOUDINARY_URL`, plus the auth
   provider's issuer. Frontend env (baked in at build time, so changes
   need a rebuild): `VITE_GRAPHQL_URI`, `VITE_API_ORIGIN`, plus the auth
   provider's publishable key. The deployed database starts empty; local
   test data stays local.
4. **Test coverage** — add tests alongside new mutations/components as
   they're touched, rather than another backfill pass; the current tests
   intentionally cover only the logic that's complex enough for a bug to
   be invisible by eye.
5. **Real data** — once deployed, actually log art you've seen.
