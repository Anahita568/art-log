package com.artlog.artlog.graphql;

import java.util.List;

public record ArtworkFilterInput(
        List<String> mediums,
        List<String> movements,
        List<String> moods,
        List<String> colors,
        List<String> subjects,
        String search) {

    static final ArtworkFilterInput NONE = new ArtworkFilterInput(null, null, null, null, null, null);
}
