package com.uptimemonitor.api.dto;

import com.uptimemonitor.common.enums.HttpMethodType;
import jakarta.validation.constraints.*;

public record CreateMonitorRequest(

        @NotBlank(message = "Monitor name is required")
        @Size(max = 255, message = "Name must be at most 255 characters")
        String name,

        @NotBlank(message = "URL is required")
        @Size(max = 2048, message = "URL must be at most 2048 characters")
        @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
        String url,

        HttpMethodType httpMethod,

        @Min(value = 100, message = "Expected status code must be at least 100")
        @Max(value = 599, message = "Expected status code must be at most 599")
        Integer expectedStatusCode,

        @Min(value = 10, message = "Check interval must be at least 10 seconds")
        @Max(value = 86400, message = "Check interval must be at most 86400 seconds (24h)")
        Integer intervalSeconds,

        @Min(value = 1000, message = "Timeout must be at least 1000ms")
        @Max(value = 30000, message = "Timeout must be at most 30000ms")
        Integer timeoutMs
) {
    /** Apply defaults for optional fields. */
    public CreateMonitorRequest {
        if (httpMethod == null) httpMethod = HttpMethodType.GET;
        if (expectedStatusCode == null) expectedStatusCode = 200;
        if (intervalSeconds == null) intervalSeconds = 60;
        if (timeoutMs == null) timeoutMs = 10000;
    }
}
