package com.artlog.artlog.graphql;

import com.artlog.artlog.model.TagType;

public record TagInput(String name, TagType type) {
}
