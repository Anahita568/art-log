package com.artlog.artlog.admin;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AdminTokenTest {

    @Test
    void matchesOnlyTheConfiguredToken() {
        AdminToken adminToken = new AdminToken("s3cret");

        assertThat(adminToken.matches("s3cret")).isTrue();
        assertThat(adminToken.matches("s3cre")).isFalse();
        assertThat(adminToken.matches("")).isFalse();
        assertThat(adminToken.matches(null)).isFalse();
    }

    @Test
    void unconfiguredTokenMatchesNothingIncludingEmpty() {
        AdminToken adminToken = new AdminToken("");

        assertThat(adminToken.matches("")).isFalse();
        assertThat(adminToken.matches(null)).isFalse();
    }
}
