package com.StarsFighters.StarsFighters.Services;
import com.StarsFighters.StarsFighters.Models.Entities.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;



@Service
public class JwtService {


   @Value("${jwt.secret}")
    private String secretKeyString;
    @Value("${jwt.expiration}")
    private long  jwtExpiration;
private Key secretKey;

    @PostConstruct
    protected void init() {
        byte[] keyBytes = Base64.getDecoder().decode(secretKeyString);
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }
    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("email", user.getEmail())
                .claim("level", user.getLevel())
                .claim("id", user.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Long extractId(String token) {
        return extractClaim(token, claims -> {
            Object idObject = claims.get("id");

            if (idObject instanceof Number) {
                return ((Number) idObject).longValue();
            } else if (idObject instanceof String) {
                return Long.parseLong((String) idObject);
            }
            throw new RuntimeException("No se encontró la ID en el token");
        });
    }
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 3. Validar si el token es válido (no ha expirado y pertenece a un usuario válido)
    // Se captura cualquier excepción de JJWT (token mal formado, expirado, firma inválida)
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            // Si hay un error al parsear (ej. token expirado o modificado), es inválido
            return false;
        }
    }

    // 4. Comprobar si el token ha expirado
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 5. Extraer la fecha de expiración
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 6. Leer todos los Claims del token usando la clave secreta
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}