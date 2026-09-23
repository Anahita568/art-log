package com.artlog.artlog.graphql;

import org.springframework.data.domain.Sort;

public enum ArtworkSort {
    CREATED_DATE_DESC(Sort.by(Sort.Direction.DESC, "createdDate")),
    CREATED_DATE_ASC(Sort.by(Sort.Direction.ASC, "createdDate")),
    YEAR_DESC(Sort.by(Sort.Direction.DESC, "year")),
    YEAR_ASC(Sort.by(Sort.Direction.ASC, "year")),
    TITLE_ASC(Sort.by(Sort.Direction.ASC, "title"));

    private final Sort sort;

    ArtworkSort(Sort sort) {
        this.sort = sort;
    }

    public Sort toSort() {
        return sort;
    }
}
