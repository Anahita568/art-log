package com.artlog.artlog.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;

import org.junit.jupiter.api.Test;

/**
 * Guards the one thing the Cloudinary wrapper decides for itself: a malformed CLOUDINARY_URL must fail
 * startup without echoing the API secret into the logs (the SDK's own exception includes the full URL).
 */
class CloudinaryImageStorageTest {

    private static final String SECRET = "not-a-real-secret";

    @Test
    void malformedUrlFailsWithoutRevealingTheSecret() {
        String malformedUrl = "cloudinary://<12345>:" + SECRET + "@demo";

        Throwable thrown = catchThrowable(() -> new CloudinaryImageStorage(malformedUrl));

        assertThat(thrown).isInstanceOf(IllegalStateException.class).hasNoCause();
        assertThat(thrown.getMessage()).doesNotContain(SECRET);
    }
}
