// package com.culture.wanderers.controller;

// import com.culture.wanderers.entity.User;
// import com.culture.wanderers.jwt.JwtUtil;
// import com.culture.wanderers.repository.UserRepository;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// @RestController
// @CrossOrigin(origins = "*")
// public class MeController {

//     private final JwtUtil jwtUtil;
//     private final UserRepository userRepository;

//     public MeController(JwtUtil jwtUtil, UserRepository userRepository) {
//         this.jwtUtil = jwtUtil;
//         this.userRepository = userRepository;
//     }

//     @GetMapping("/api/me")
//     public User me(@RequestHeader(name = "Authorization", required = false) String authHeader) {

//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             throw new RuntimeException("토큰 없음");
//         }

//         String token = authHeader.substring(7);
//         String email = jwtUtil.extractEmail(token);

//         return userRepository.findByEmail(email)
//                 .orElseThrow(() -> new RuntimeException("사용자 없음"));
//     }
// }
package com.culture.wanderers.controller;

import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "*")
public class MeController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public MeController(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @GetMapping("/api/me")
    public User me(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }
        
        // @PostMapping("/logout")
        // public Map<string, string> logout() {
        //     return Map.of("message", "로그아웃 성공. 클라이언트에서 토큰을 삭제하세요.");
        // }

        String token = authHeader.substring(7);
        String email;

        try {
            email = jwtUtil.extractEmail(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰");
        }

        return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));
    }
}