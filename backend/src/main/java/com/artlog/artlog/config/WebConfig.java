package com.artlog.artlog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${artlog.frontend-origin-pattern:http://localhost:*}")
    private String frontendOriginPattern;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/graphql").allowedOriginPatterns(frontendOriginPattern).allowedMethods("POST");
        registry.addMapping("/api/**").allowedOriginPatterns(frontendOriginPattern).allowedMethods("POST", "GET");
    }
}
