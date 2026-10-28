package com.artlog.artlog.storage;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocalDiskImageStorageTest {

    private static final String BASE_URL = "http://localhost:8080";

    @TempDir
    Path uploadDir;

    @Test
    void writesImageToDiskAndReturnsAbsoluteUrlForIt() throws IOException {
        LocalDiskImageStorage storage = new LocalDiskImageStorage(uploadDir.toString(), BASE_URL);
        byte[] content = {1, 2, 3};

        String url = storage.store(content, ".jpg");

        assertThat(url).startsWith(BASE_URL + "/uploads/").endsWith(".jpg");
        String filename = url.substring(url.lastIndexOf('/') + 1);
        assertThat(Files.readAllBytes(uploadDir.resolve(filename))).isEqualTo(content);
    }
}
