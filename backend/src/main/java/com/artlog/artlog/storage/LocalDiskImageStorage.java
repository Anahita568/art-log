package com.artlog.artlog.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Writes images to a local directory and serves them back from {@code /uploads/**}. Dev only: the files
 * live on the backend's own disk, so they vanish on any host with an ephemeral filesystem.
 */
@Component
@ConditionalOnProperty(name = "artlog.storage", havingValue = "local", matchIfMissing = true)
public class LocalDiskImageStorage implements ImageStorage, WebMvcConfigurer {

    private static final String URL_PATH = "/uploads/";

    private final Path uploadDir;
    private final String publicBaseUrl;

    public LocalDiskImageStorage(
            @Value("${artlog.upload-dir}") String uploadDir,
            @Value("${artlog.public-base-url}") String publicBaseUrl) throws IOException {
        this.uploadDir = Path.of(uploadDir).toAbsolutePath();
        this.publicBaseUrl = publicBaseUrl;
        Files.createDirectories(this.uploadDir);
    }

    @Override
    public String store(byte[] content, String extension) throws IOException {
        String filename = UUID.randomUUID() + extension;
        Files.write(uploadDir.resolve(filename), content);
        return publicBaseUrl + URL_PATH + filename;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler(URL_PATH + "**").addResourceLocations("file:" + uploadDir + "/");
    }
}
