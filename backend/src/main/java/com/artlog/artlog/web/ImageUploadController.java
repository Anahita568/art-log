package com.artlog.artlog.web;

import java.io.IOException;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.artlog.artlog.storage.ImageStorage;

@RestController
public class ImageUploadController {

    private static final Map<String, String> EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    private final ImageStorage imageStorage;

    public ImageUploadController(ImageStorage imageStorage) {
        this.imageStorage = imageStorage;
    }

    @PostMapping("/api/images")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String extension = EXTENSION_BY_CONTENT_TYPE.get(file.getContentType());
        if (extension == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Unsupported image type: " + file.getContentType()));
        }

        String url = imageStorage.store(file.getBytes(), extension);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("url", url));
    }
}
