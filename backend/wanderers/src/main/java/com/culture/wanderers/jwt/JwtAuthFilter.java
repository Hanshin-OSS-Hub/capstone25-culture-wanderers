package com.culture.wanderers.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // 토큰이 없으면 그냥 다음 필터로 (SecurityConfig가 막을 요청은 막음)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authHeader.substring(7);
            String email = jwtUtil.extractEmail(token);

            // 이미 인증된 상태면 중복 세팅 안 함
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                // 권한은 일단 USER 하나만 부여 (나중에 ROLE 확장 가능)
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_USER"));

                var authentication = new UsernamePasswordAuthenticationToken(
                        email,          // principal
                        null,           // credentials
                        authorities
                );

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            // 토큰 오류/만료/변조 → 인증 실패로 처리(그냥 비워두고 진행)
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}