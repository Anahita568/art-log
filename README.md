# Art Log

A personal art cataloging tool: save pieces you've encountered, tag them
along independent axes (medium, movement, mood, color, subject), and filter
your collection by any combination of tags.

**Stack:** Spring Boot + GraphQL (backend), PostgreSQL (database), React +
TypeScript + Apollo Client (frontend, not yet scaffolded).

## Status

Backend data model and GraphQL API are in place and verified end-to-end:

- `Artwork` and `Tag` JPA entities, many-to-many via `artwork_tag`
- `artworks(filter)`, `artwork(id)`, and `tags(type)` queries
- Composable tag filtering: any combination of medium/movement/mood/color/subject
  values (AND across axes, OR within an axis), plus free-text search over
  title/artist — see `ArtworkSpecifications`
- Mutations: `addArtwork` (creating tags on the fly if they don't exist yet),
  `updateArtworkNotes`, `deleteArtwork`
- Seed data for a starter set of tags across all five axes

Not yet built: the frontend.

## Backend setup

**Requirements:** Java 21, Maven, PostgreSQL 16.

### Database

A `docker-compose.yml` is included at the repo root for running Postgres in
a container:

```bash
docker compose up -d
```

If Docker isn't available, install Postgres directly (e.g. via Homebrew)
and create a matching role/database:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb artlog
psql -d artlog -c "CREATE ROLE artlog WITH LOGIN PASSWORD 'artlog';"
psql -d artlog -c "ALTER DATABASE artlog OWNER TO artlog;"
psql -d artlog -c "GRANT ALL ON SCHEMA public TO artlog;"
```

Either way, the app expects a database `artlog` reachable at
`localhost:5432` with role `artlog` / password `artlog` (override via the
`DB_USERNAME` / `DB_PASSWORD` env vars — see `backend/src/main/resources/application.yml`).

### Run the app

```bash
cd backend
mvn spring-boot:run
```

On startup, Hibernate creates the schema (`ddl-auto: update`) and
`data.sql` seeds the starter tags. GraphiQL is available at
`http://localhost:8080/graphiql` for exploring the API by hand; the
GraphQL endpoint itself is `http://localhost:8080/graphql`.

Example query:

```graphql
{
  artworks(filter: { mediums: ["Oil paint"], moods: ["Nostalgic"], search: "night" }) {
    id
    title
    tags { name type }
  }
  tags(type: MOOD) {
    name
  }
}
```

Example mutation:

```graphql
mutation {
  addArtwork(input: {
    title: "Starry Night"
    artist: "Vincent van Gogh"
    year: 1889
    tags: [{ name: "Oil paint", type: MEDIUM }, { name: "Nostalgic", type: MOOD }]
  }) {
    id
    tags { name type }
  }
}
```
