package com.culture.wanderers.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.dto.UpdateMeRequest;
import com.culture.wanderers.entity.User;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.UserRepository;

@RestController
@CrossOrigin(origins = "*")
public class MeController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public MeController(JwtUtil jwtUtil, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/api/me")
    public User me(@RequestHeader(name = "Authorization", required = false) String authHeader) {
        String email = extractEmail(authHeader);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    }

    @PatchMapping("/api/me")
    public User updateMe(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestBody UpdateMeRequest request
    ) {
        User user = me(authHeader);

        String nickname = request.getNickname() == null ? "" : request.getNickname().trim();
        if (nickname.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임을 입력해주세요.");
        }
        if (nickname.length() < 2 || nickname.length() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임은 2자 이상 20자 이하로 입력해주세요.");
        }

        user.setNickname(nickname);

        String password = request.getPassword() == null ? "" : request.getPassword().trim();
        if (!password.isBlank()) {
            if (password.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 6자 이상이어야 합니다.");
            }
            user.setPassword(passwordEncoder.encode(password));
        }

        return userRepository.save(user);
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 없습니다.");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다.");
        }
    }
}
