import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { DELETE_TAG_MUTATION, RENAME_TAG_MUTATION } from "../graphql/mutations";
import { TAGS_QUERY } from "../graphql/queries";
import { groupTagsByType, TAG_AXES } from "../tagAxes";
import type { Tag } from "../types";
import "./TagManager.css";

interface TagManagerProps {
  onClose: () => void;
}

export function TagManager({ onClose }: TagManagerProps) {
  const { data } = useQuery<{ tags: Tag[] }>(TAGS_QUERY);
  const tagsByType = groupTagsByType(data?.tags ?? []);

  return (
    <div className="tag-manager-overlay" onClick={onClose}>
      <div className="tag-manager" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="tag-manager__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Manage tags</h2>

        {TAG_AXES.map(({ type, label }) => (
          <section key={type} className="tag-manager__axis">
            <h3>{label}</h3>
            {(tagsByType[type] ?? []).length === 0 ? (
              <p className="tag-manager__empty">No tags yet.</p>
            ) : (
              <ul className="tag-manager__list">
                {(tagsByType[type] ?? []).map((tag) => (
                  <TagRow key={tag.id} tag={tag} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function TagRow({ tag }: { tag: Tag }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(tag.name);

  const [renameTag, { loading: renaming, error: renameError }] = useMutation(RENAME_TAG_MUTATION, {
    refetchQueries: ["Tags", "Artworks"],
  });
  const [deleteTag, { loading: deleting }] = useMutation(DELETE_TAG_MUTATION, {
    refetchQueries: ["Tags", "Artworks"],
  });

  function startRenaming() {
    setDraftName(tag.name);
    setIsRenaming(true);
  }

  async function saveRename() {
    if (!draftName.trim() || draftName === tag.name) {
      setIsRenaming(false);
      return;
    }
    await renameTag({ variables: { id: tag.id, name: draftName.trim() } });
    setIsRenaming(false);
  }

  async function handleDelete() {
    const usageWarning =
      tag.usageCount > 0 ? ` It's used by ${tag.usageCount} piece(s) and will be removed from them.` : "";
    if (window.confirm(`Delete the tag "${tag.name}"?${usageWarning}`)) {
      await deleteTag({ variables: { id: tag.id } });
    }
  }

  if (isRenaming) {
    return (
      <li className="tag-manager__row">
        <input
          className="tag-manager__rename-input"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          autoFocus
        />
        <div className="tag-manager__row-actions">
          <button type="button" onClick={() => setIsRenaming(false)}>
            Cancel
          </button>
          <button type="button" onClick={saveRename} disabled={renaming}>
            {renaming ? "Saving…" : "Save"}
          </button>
        </div>
        {renameError && <p className="form-error">{renameError.message}</p>}
      </li>
    );
  }

  return (
    <li className="tag-manager__row">
      <span className="tag-manager__name">{tag.name}</span>
      <span className="tag-manager__usage">{tag.usageCount === 1 ? "1 piece" : `${tag.usageCount} pieces`}</span>
      <div className="tag-manager__row-actions">
        <button type="button" className="card-action" onClick={startRenaming}>
          Rename
        </button>
        <button type="button" className="card-action card-action--delete" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Removing…" : "Delete"}
        </button>
      </div>
    </li>
  );
}
