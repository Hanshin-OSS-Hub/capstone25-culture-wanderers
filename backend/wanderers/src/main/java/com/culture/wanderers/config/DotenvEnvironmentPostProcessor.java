package com.culture.wanderers.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> values = new LinkedHashMap<>();
        for (Path path : candidatePaths()) {
            loadDotenv(path, values);
        }

        if (!values.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("workspaceDotenv", values));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }

    private List<Path> candidatePaths() {
        Path cwd = Path.of("").toAbsolutePath().normalize();
        return List.of(
                cwd.resolve(".env"),
                cwd.resolve(".env.local"),
                cwd.resolve(".env.example"),
                cwd.getParent() != null ? cwd.getParent().resolve(".env") : cwd.resolve(".env"),
                cwd.getParent() != null ? cwd.getParent().resolve(".env.local") : cwd.resolve(".env.local"),
                cwd.getParent() != null ? cwd.getParent().resolve(".env.example") : cwd.resolve(".env.example"),
                cwd.getParent() != null && cwd.getParent().getParent() != null
                        ? cwd.getParent().getParent().resolve(".env")
                        : cwd.resolve(".env"),
                cwd.getParent() != null && cwd.getParent().getParent() != null
                        ? cwd.getParent().getParent().resolve(".env.local")
                        : cwd.resolve(".env.local"),
                cwd.getParent() != null && cwd.getParent().getParent() != null
                        ? cwd.getParent().getParent().resolve(".env.example")
                        : cwd.resolve(".env.local")
        );
    }

    private void loadDotenv(Path path, Map<String, Object> values) {
        if (path == null || !Files.isRegularFile(path)) {
            return;
        }

        try {
            for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                String trimmed = line.trim();
                if (trimmed.isBlank() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }

                int separator = trimmed.indexOf('=');
                String key = trimmed.substring(0, separator).trim();
                String value = trimmed.substring(separator + 1).trim();
                if ((value.startsWith("\"") && value.endsWith("\""))
                        || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                if (!key.isBlank()) {
                    values.put(key, value);
                }
            }
        } catch (IOException ignored) {
        }
    }
}
