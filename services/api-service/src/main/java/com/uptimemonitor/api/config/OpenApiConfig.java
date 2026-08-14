package com.uptimemonitor.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Uptime Monitor API")
                        .description("Website & API uptime monitoring platform")
                        .version("0.1.0")
                        .contact(new Contact().name("Uptime Monitor Team")))
                .addSecurityItem(new SecurityRequirement().addList("session"))
                .schemaRequirement("session",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("JSESSIONID")
                                .description("Session cookie — authenticate via Google OAuth 2.0 at /oauth2/authorization/google"));
    }
}
