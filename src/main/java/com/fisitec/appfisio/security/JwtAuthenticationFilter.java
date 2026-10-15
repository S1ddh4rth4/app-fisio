package com.fisitec.appfisio.security;

import com.fisitec.appfisio.service.JwtService;
import com.fisitec.appfisio.service.UserService;
import com.fisitec.appfisio.entity.User;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

/**
 * Filter for JWT authentication.
 * Intercepts requests to validate JWT tokens and set authentication context.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserService userService;

    /**
     * Filter method to process JWT authentication.
     * 
     * @param request     the HTTP request
     * @param response    the HTTP response
     * @param filterChain the filter chain
     * @throws ServletException if servlet error occurs
     * @throws IOException      if I/O error occurs
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Skip JWT validation for authentication endpoints
        if (request.getRequestURI().startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        // JWT Token is in the form "Bearer token". Remove Bearer word and get only the
        // Token
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7);
            try {
                username = jwtService.extractUsername(jwtToken);
            } catch (Exception e) {
                logger.warn("Unable to get JWT Token or JWT Token has expired");
            }
        } else {
            logger.debug("JWT Token does not begin with Bearer String");
        }

        // Validación de autenticidad, vigencia y no-revocación de la sesión
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userService.findByUsername(username).orElse(null);

            if (user != null && Boolean.TRUE.equals(user.getEnabled())) {
                Integer tokenVersion = jwtService.extractTokenVersion(jwtToken);
                Integer activeVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 1;

                // Si el token fue revocado (ej. cambio de contraseña), denegamos el acceso
                if (tokenVersion == null || !tokenVersion.equals(activeVersion)) {
                    logger.warn("Acceso denegado: Token JWT revocado para el usuario " + username);
                    filterChain.doFilter(request, response);
                    return;
                }

                UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                        .username(user.getUsername())
                        .password(user.getPassword())
                        .disabled(!user.getEnabled())
                        .authorities(user.getRoles().stream()
                                .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority(
                                        role.getName()))
                                .collect(Collectors.toList()))
                        .build();

                if (jwtService.validateToken(jwtToken, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}