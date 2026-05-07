// package com.culture.wanderers.jwt;

// import io.jsonwebtoken.*;
// import io.jsonwebtoken.security.Keys;
// import org.springframework.stereotype.Component;

// import java.util.Date;

// @Component
// public class JwtUtil {

//     private final String SECRET_KEY = "wanderers-secret-key-wanderers-secret-key";
//     private final long EXPIRATION = 1000 * 60 * 60; // 1시간

//     public String generateToken(String email) { 
//         return Jwts.builder()
//                 .setSubject(email)
//                 .setIssuedAt(new Date())
//                 .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
//                 .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
//                 .compact();
//     }
//     public String extractEmail(String token) {
//     return Jwts.parserBuilder()
//             .setSigningKey(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
//             .build()
//             .parseClaimsJws(token)
//             .getBody()
//             .getSubject();
// }
// }
package com.culture.wanderers.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final String SECRET_KEY = "wanderers-secret-key-wanderers-secret-key";
    private final long EXPIRATION = 1000 * 60 * 60; // 1시간

    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}