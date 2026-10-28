package com.artlog.artlog.storage;

import java.io.IOException;

/**
 * Where uploaded images end up. Selected by {@code artlog.storage}: {@code local} (default, for dev) or
 * {@code cloudinary} (for any deploy, since hosts don't keep a persistent filesystem).
 */
public interface ImageStorage {

    /**
     * Stores the image and returns an absolute URL the browser can load it from.
     *
     * @param extension file extension including the dot, e.g. {@code ".jpg"}
     */
    String store(byte[] content, String extension) throws IOException;
}
