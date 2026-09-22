package com.artlog.artlog.graphql;

import java.util.List;

public record AddArtworkInput(
        String title,
        String artist,
        Integer year,
        String imageUrl,
        String notes,
        List<TagInput> tags) {
}
