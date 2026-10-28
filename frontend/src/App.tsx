import { useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { ArtworkGrid } from "./components/ArtworkGrid";
import { AddArtworkForm } from "./components/AddArtworkForm";
import { TagManager } from "./components/TagManager";
import { OwnerAccess } from "./components/OwnerAccess";
import { useAdminAccess } from "./useAdminAccess";
import type { ArtworkFilterInput, ArtworkSort } from "./types";
import "./App.css";

const SORT_OPTIONS: ReadonlyArray<{ value: ArtworkSort; label: string }> = [
  { value: "CREATED_DATE_DESC", label: "Newest added" },
  { value: "CREATED_DATE_ASC", label: "Oldest added" },
  { value: "YEAR_DESC", label: "Year, newest first" },
  { value: "YEAR_ASC", label: "Year, oldest first" },
  { value: "TITLE_ASC", label: "Title, A–Z" },
];

export default function App() {
  const [filter, setFilter] = useState<ArtworkFilterInput>({});
  const [sort, setSort] = useState<ArtworkSort>("CREATED_DATE_DESC");
  const [isManagingTags, setIsManagingTags] = useState(false);
  const { isAdmin, unlock, lock } = useAdminAccess();

  return (
    <div className="app">
      <header className="app__header">
        <h1>Art Log</h1>
        <p className="app__subtitle">track your art</p>
      </header>

      <FilterPanel
        filter={filter}
        onChange={setFilter}
        onManageTags={isAdmin ? () => setIsManagingTags(true) : undefined}
      />

      <div className="app__toolbar">
        {isAdmin && <AddArtworkForm />}
        <label className="app__sort">
          Sort by
          <select value={sort} onChange={(event) => setSort(event.target.value as ArtworkSort)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ArtworkGrid key={`${JSON.stringify(filter)}|${sort}`} filter={filter} sort={sort} canEdit={isAdmin} />

      {isAdmin && isManagingTags && <TagManager onClose={() => setIsManagingTags(false)} />}

      <footer className="app__footer">
        <OwnerAccess isAdmin={isAdmin} onUnlock={unlock} onLock={lock} />
      </footer>
    </div>
  );
}
