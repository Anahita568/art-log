package com.artlog.artlog.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import com.artlog.artlog.storage.ImageStorage;

/**
 * Covers the controller's only real decision: which content types reach storage, and with which extension.
 */
class ImageUploadControllerTest {

    private static final byte[] IMAGE_BYTES = {1, 2, 3};

    private String storedExtension;
    private final ImageStorage recordingStorage = (content, extension) -> {
        storedExtension = extension;
        return "https://images.example/stored" + extension;
    };
    private final ImageUploadController controller = new ImageUploadController(recordingStorage);

    @Test
    void storesSupportedImageAndReturnsItsUrl() throws IOException {
        ResponseEntity<?> response = controller.upload(fileOfType("image/png"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(Map.of("url", "https://images.example/stored.png"));
        assertThat(storedExtension).isEqualTo(".png");
    }

    @Test
    void rejectsUnsupportedTypeWithoutStoringIt() throws IOException {
        ResponseEntity<?> response = controller.upload(fileOfType("application/pdf"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(storedExtension).isNull();
    }

    private static MockMultipartFile fileOfType(String contentType) {
        return new MockMultipartFile("file", "upload", contentType, IMAGE_BYTES);
    }
}
