import { useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { ArtworkGrid } from "./components/ArtworkGrid";
import { AddArtworkForm } from "./components/AddArtworkForm";
import type { ArtworkFilterInput } from "./types";
import "./App.css";

export default function App() {
  const [filter, setFilter] = useState<ArtworkFilterInput>({});

  return (
    <div className="app">
      <header className="app__header">
        <h1>Art Log</h1>
        <p className="app__subtitle">A catalog of pieces worth remembering.</p>
      </header>
      <div className="app__body">
        <FilterPanel filter={filter} onChange={setFilter} />
        <main className="app__main">
          <AddArtworkForm />
          <ArtworkGrid filter={filter} />
        </main>
      </div>
    </div>
  );
}
