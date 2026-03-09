// package com.culture.wanderers.controller;

// import com.culture.wanderers.entity.User;
// import com.culture.wanderers.repository.UserRepository;
// import com.culture.wanderers.jwt.JwtUtil;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.web.bind.annotation.*;

// import java.util.Map;

// @RestController
// @RequestMapping("/api/auth")
// @CrossOrigin(origins = "*")
// public class AuthController {

//     private final UserRepository userRepository;
//     private final JwtUtil jwtUtil;
//     private final PasswordEncoder passwordEncoder;

//     public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
//         this.userRepository = userRepository;
//         this.jwtUtil = jwtUtil;
//         this.passwordEncoder = passwordEncoder;
//     }

//     // @PostMapping("/signup")
//     // public User signup(@RequestBody User user) {
//     //     user.setPassword(passwordEncoder.encode(user.getPassword()));
//     //     return userRepository.save(user);
//     // }
//     @PostMapping("/signup")
// public User signup(@RequestBody User user) {

//     if (userRepository.findByEmail(user.getEmail()).isPresent()) {
//         throw new RuntimeException("이미 가입된 이메일");
//     }

//     user.setPassword(passwordEncoder.encode(user.getPassword()));
//     return userRepository.save(user);
// }

//     @PostMapping("/login")
//     public Map<String, String> login(@RequestBody Map<String, String> credentials) {

//         String email = credentials.get("email");
//         String password = credentials.get("password");

//         User user = userRepository.findByEmail(email)
//                 .orElseThrow(() -> new RuntimeException("사용자 없음"));

//         if (!passwordEncoder.matches(password, user.getPassword())) {
//             throw new RuntimeException("비밀번호 틀림");
//         }

//         String token = jwtUtil.generateToken(email);
//         return Map.of("token", token);
//     }
// }
package com.culture.wanderers.controller;

import com.culture.wanderers.dto.AuthResponse;
import com.culture.wanderers.dto.LoginRequest;
import com.culture.wanderers.dto.SignupRequest;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/signup")
    public User signup(@RequestBody SignupRequest req) {

        if (req.getEmail() == null || req.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email/password 누락");
        }

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setName(req.getName());

        return userRepository.save(user);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest req) {

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "사용자 없음"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "비밀번호 틀림");
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token);
    }
}