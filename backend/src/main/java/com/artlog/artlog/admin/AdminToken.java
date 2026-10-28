package com.artlog.artlog.admin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * The single secret that unlocks writes. Visitors browse read-only; whoever sends this token in the
 * {@value #HEADER} header can add, edit, delete, and upload. With no token configured, nothing can write.
 */
@Component
public class AdminToken {

    public static final String HEADER = "X-Admin-Token";

    private static final Logger log = LoggerFactory.getLogger(AdminToken.class);

    private final byte[] expected;

    public AdminToken(@Value("${artlog.admin-token}") String configuredToken) {
        this.expected = configuredToken.getBytes(StandardCharsets.UTF_8);
        if (configuredToken.isBlank()) {
            log.warn("ADMIN_TOKEN is not set: the catalog is read-only for everyone");
        }
    }

    /** Constant-time comparison, so response timing doesn't reveal how much of a guess was right. */
    public boolean matches(String presented) {
        if (expected.length == 0 || presented == null) {
            return false;
        }
        return MessageDigest.isEqual(expected, presented.getBytes(StandardCharsets.UTF_8));
    }
}
