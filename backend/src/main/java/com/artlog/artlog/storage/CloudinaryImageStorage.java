package com.artlog.artlog.storage;

import java.io.IOException;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

/**
 * Uploads images to Cloudinary. Configured entirely by {@code CLOUDINARY_URL}
 * ({@code cloudinary://<api_key>:<api_secret>@<cloud_name>}, from the Cloudinary dashboard).
 */
@Component
@ConditionalOnProperty(name = "artlog.storage", havingValue = "cloudinary")
public class CloudinaryImageStorage implements ImageStorage {

    private static final String FOLDER = "artlog";

    private final Cloudinary cloudinary;

    public CloudinaryImageStorage(@Value("${artlog.cloudinary-url}") String cloudinaryUrl) {
        if (cloudinaryUrl.isBlank()) {
            throw new IllegalStateException("artlog.storage=cloudinary requires CLOUDINARY_URL to be set");
        }
        this.cloudinary = connect(cloudinaryUrl);
    }

    /** Rethrows a malformed URL without its message or cause, both of which would log the API secret. */
    private static Cloudinary connect(String cloudinaryUrl) {
        try {
            return new Cloudinary(cloudinaryUrl);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "CLOUDINARY_URL is malformed; expected cloudinary://<api_key>:<api_secret>@<cloud_name>"
                            + " with real values and no angle brackets");
        }
    }

    /** Cloudinary detects the format from the bytes and names the file itself, so the extension is unused. */
    @Override
    public String store(byte[] content, String extension) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(content, ObjectUtils.asMap(
                "folder", FOLDER,
                "resource_type", "image"));
        return (String) result.get("secure_url");
    }
}
