import { useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { ArtworkGrid } from "./components/ArtworkGrid";
import { AddArtworkForm } from "./components/AddArtworkForm";
import { TagManager } from "./components/TagManager";
import type { ArtworkFilterInput } from "./types";
import "./App.css";

export default function App() {
  const [filter, setFilter] = useState<ArtworkFilterInput>({});
  const [isManagingTags, setIsManagingTags] = useState(false);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Art Log</h1>
        <p className="app__subtitle">A catalog of pieces worth remembering.</p>
      </header>
      <div className="app__body">
        <FilterPanel filter={filter} onChange={setFilter} onManageTags={() => setIsManagingTags(true)} />
        <main className="app__main">
          <AddArtworkForm />
          <ArtworkGrid filter={filter} />
        </main>
      </div>
      {isManagingTags && <TagManager onClose={() => setIsManagingTags(false)} />}
    </div>
  );
}
