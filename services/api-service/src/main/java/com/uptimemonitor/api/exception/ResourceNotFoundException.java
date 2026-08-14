package com.uptimemonitor.api.exception;

import java.util.UUID;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, UUID id) {
        super(String.format("%s not found: %s", resource, id));
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
