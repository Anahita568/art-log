package com.artlog.artlog.graphql;

import java.util.List;

public record UpdateArtworkInput(
        String title,
        String artist,
        Integer year,
        String imageUrl,
        List<TagInput> tags) {
}
