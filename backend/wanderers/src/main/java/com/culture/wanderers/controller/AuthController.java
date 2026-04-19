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
        user.setNickname(req.getName());      return userRepository.save(user);
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

// package com.culture.wanderers.controller;

// import com.culture.wanderers.jwt.JwtUtil;
// import com.culture.wanderers.repository.*;
// import org.springframework.http.HttpStatus;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.server.ResponseStatusException;

// import java.util.Map;

// @RestController
// @CrossOrigin(origins = "*")
// public class AccountController {

//     private final JwtUtil jwtUtil;
//     private final UserRepository userRepository;
//     private final ReviewRepository reviewRepository;
//     private final PartyRepository partyRepository;
//     private final PartyMemberRepository partyMemberRepository;
//     private final UserLikeRepository userLikeRepository;
//     private final CalendarEventRepository calendarEventRepository;

//     public AccountController(
//             JwtUtil jwtUtil,
//             UserRepository userRepository,
//             ReviewRepository reviewRepository,
//             PartyRepository partyRepository,
//             PartyMemberRepository partyMemberRepository,
//             UserLikeRepository userLikeRepository,
//             CalendarEventRepository calendarEventRepository
//     ) {
//         this.jwtUtil = jwtUtil;
//         this.userRepository = userRepository;
//         this.reviewRepository = reviewRepository;
//         this.partyRepository = partyRepository;
//         this.partyMemberRepository = partyMemberRepository;
//         this.userLikeRepository = userLikeRepository;
//         this.calendarEventRepository = calendarEventRepository;
//     }

//     @DeleteMapping("/api/me")
//     public Map<String, String> deleteMyAccount(
//             @RequestHeader(name = "Authorization", required = false) String authHeader
//     ) {
//         String email = extractEmail(authHeader);

//         if (userRepository.findByEmail(email).isEmpty()) {
//             throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음");
//         }

//         reviewRepository.deleteByAuthorEmail(email);
//         partyRepository.deleteByAuthorEmail(email);
//         partyMemberRepository.deleteByUserEmail(email);
//         userLikeRepository.deleteByUserEmail(email);
//         calendarEventRepository.deleteByUserEmail(email);
//         userRepository.deleteByEmail(email);

//         return Map.of("message", "회원탈퇴 완료");
//     }

//     private String extractEmail(String authHeader) {
//         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
//             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
//         }

//         try {
//             return jwtUtil.extractEmail(authHeader.substring(7));
//         } catch (Exception e) {
//             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류");
//         }
//     }
// }