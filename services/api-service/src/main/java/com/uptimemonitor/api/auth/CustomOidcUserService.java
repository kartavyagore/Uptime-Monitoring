package com.uptimemonitor.api.auth;

import com.uptimemonitor.api.service.UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

/**
 * Custom OIDC user service that provisions / updates the application user
 * in our database upon successful Google authentication.
 *
 * Flow:
 * 1. Spring Security validates the OIDC ID token from Google.
 * 2. This service receives the authenticated OidcUser.
 * 3. We extract the stable "sub" claim and profile info.
 * 4. We find-or-create the user in our database.
 * 5. Return the OidcUser so Spring Security can establish the session.
 */
@Component
public class CustomOidcUserService extends OidcUserService {

    private final UserService userService;

    public CustomOidcUserService(UserService userService) {
        this.userService = userService;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        // Extract stable Google identity
        String googleSubject = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName();
        String pictureUrl = oidcUser.getPicture();

        // Provision or update the application user
        userService.findOrCreateUser(googleSubject, email, name, pictureUrl);

        return oidcUser;
    }
}
