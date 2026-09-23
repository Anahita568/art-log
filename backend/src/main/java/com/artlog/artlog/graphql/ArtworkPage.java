package com.artlog.artlog.graphql;

import java.util.List;

import com.artlog.artlog.model.Artwork;

public record ArtworkPage(List<Artwork> items, long totalCount, boolean hasMore) {
}
