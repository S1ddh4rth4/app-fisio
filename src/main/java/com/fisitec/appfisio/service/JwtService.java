package com.fisitec.appfisio.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Service for handling JWT token operations.
 * Generates, validates, and extracts information from JWT tokens.
 */
@Service
public class JwtService {

    /**
     * Secret key for signing JWT tokens.
     * In production, this should be stored securely (e.g., environment variable).
     */
    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Tiempo de expiración del token JWT: 4 horas por defecto (14,400,000 ms).
     */
    @Value("${jwt.expiration:14400000}")
    private long jwtExpiration;

    /**
     * Get the signing key for JWT.
     * 
     * @return the Key for signing
     */
    private Key getSignInKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extract username from JWT token.
     * 
     * @param token the JWT token
     * @return the username
     */
    public String extractUsername(String token) {
        return extractClaim(token, claims -> claims.getSubject());
    }

    /**
     * Extract expiration date from JWT token.
     * 
     * @param token the JWT token
     * @return the expiration date
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, claims -> claims.getExpiration());
    }

    /**
     * Extract a specific claim from JWT token.
     * 
     * @param token          the JWT token
     * @param claimsResolver function to extract the claim
     * @param <T>            the type of the claim
     * @return the claim value
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Extract all claims from JWT token.
     * 
     * @param token the JWT token
     * @return the claims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Check if JWT token is expired.
     * 
     * @param token the JWT token
     * @return true if expired, false otherwise
     */
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Genera un token JWT incluyendo la versión de sesión activa del usuario.
     */
    public String generateToken(UserDetails userDetails, Integer tokenVersion) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("tokenVersion", tokenVersion != null ? tokenVersion : 1);
        return createToken(claims, userDetails.getUsername());
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(userDetails, 1);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Extrae el número de versión de sesión con casteo seguro a Number.
     */
    public Integer extractTokenVersion(String token) {
        try {
            return extractClaim(token, claims -> {
                Object val = claims.get("tokenVersion");
                if (val instanceof Number number) {
                    return number.intValue();
                }
                return null;
            });
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Validate JWT token against user details.
     * 
     * @param token       the JWT token
     * @param userDetails the user details
     * @return true if valid, false otherwise
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}