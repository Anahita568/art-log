package com.artlog.artlog.repository;

import java.util.List;

import org.springframework.data.jpa.domain.Specification;

import com.artlog.artlog.model.Artwork;
import com.artlog.artlog.model.Tag;
import com.artlog.artlog.model.TagType;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

public final class ArtworkSpecifications {

    private ArtworkSpecifications() {
    }

    /**
     * Matches artworks tagged with any of the given names on the given axis. Uses a correlated EXISTS
     * subquery (rather than joining "tags" on the main query) so it composes cleanly across axes and
     * stays pagination-safe (no row duplication from a to-many join).
     */
    public static Specification<Artwork> hasAnyTag(TagType type, List<String> names) {
        if (names == null || names.isEmpty()) {
            return null;
        }
        return (root, query, cb) -> {
            Subquery<Long> subquery = query.subquery(Long.class);
            Root<Artwork> subRoot = subquery.correlate(root);
            Join<Artwork, Tag> tag = subRoot.join("tags");
            subquery.select(cb.literal(1L))
                    .where(cb.equal(tag.get("type"), type), tag.get("name").in(names));
            return cb.exists(subquery);
        };
    }

    public static Specification<Artwork> matchesSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        String pattern = "%" + search.toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("artist")), pattern));
    }
}
