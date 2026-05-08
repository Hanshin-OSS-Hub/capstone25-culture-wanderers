package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Comment;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.UserRankService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentRepository commentRepository;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final UserRankService userRankService;

    public CommentController(CommentRepository commentRepository, JwtUtil jwtUtil, UserRepository userRepository, UserRankService userRankService) {
        this.commentRepository = commentRepository;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.userRankService = userRankService;
    }

    @GetMapping("/api/comments")
    public List<Comment> getComments(
            @RequestParam("targetType") String targetType,
            @RequestParam("targetId") Long targetId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        if (targetType == null || targetType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType is required.");
        }
        if (targetId == null || targetId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetId must be positive.");
        }

        List<Comment> comments = commentRepository.findByTargetTypeAndTargetIdOrderByCreatedAtAsc(
                targetType.toUpperCase(),
                targetId
        );
        String viewerEmail = extractOptionalEmail(authHeader);
        comments.forEach(comment -> applyCommentVisibility(comment, viewerEmail));
        return comments;
    }

    @PostMapping("/api/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public Comment createComment(
            @RequestBody Comment comment,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        if (comment.getTargetType() == null || comment.getTargetType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetType is required.");
        }
        if (comment.getTargetId() == null || comment.getTargetId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetId must be positive.");
        }
        if (comment.getContent() == null || comment.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용을 입력해주세요.");
        }

        comment.setTargetType(comment.getTargetType().toUpperCase());
        comment.setContent(comment.getContent().trim());
        comment.setUserEmail(email);
        comment.setCreatedAt(LocalDateTime.now());

        // 익명 처리: 파티 댓글은 익명 불가
        if ("PARTY".equalsIgnoreCase(comment.getTargetType())) {
            comment.setIsAnonymous(false);
        } else if (comment.getIsAnonymous() == null) {
            comment.setIsAnonymous(false);
        }

        Comment saved = commentRepository.save(comment);
        double points = userRankService.pointsForComment(comment.getTargetType());
        userRankService.addPoints(email, points);
        applyCommentVisibility(saved, email);
        return saved;
    }

    @PatchMapping("/api/comments/{id}")
    public Comment updateComment(
            @PathVariable Long id,
            @RequestBody Comment detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글 없음"));

        if (comment.getUserEmail() == null || !comment.getUserEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 댓글만 수정할 수 있습니다.");
        }

        if (detail.getContent() == null || detail.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용을 입력해주세요.");
        }

        comment.setContent(detail.getContent().trim());
        Comment saved = commentRepository.save(comment);
        applyCommentVisibility(saved, email);
        return saved;
    }

    @DeleteMapping("/api/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글 없음"));

        if (comment.getUserEmail() == null || !comment.getUserEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 댓글만 삭제할 수 있습니다.");
        }

        commentRepository.deleteById(id);
    }

    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류/만료");
        }
    }

    private String extractOptionalEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }

    private void attachUserNickname(Comment comment) {
        if (comment == null || comment.getUserEmail() == null || comment.getUserEmail().isBlank()) {
            return;
        }

        String fallback = comment.getUserEmail().contains("@")
                ? comment.getUserEmail().split("@")[0]
                : comment.getUserEmail();

        String nickname = userRepository.findByEmail(comment.getUserEmail())
                .map(user -> user.getNickname())
                .filter(name -> name != null && !name.isBlank())
                .orElse(fallback);

        comment.setUserNickname(nickname);
    }

    private void applyCommentVisibility(Comment comment, String viewerEmail) {
        if (comment == null) {
            return;
        }

        if (comment.getIsAnonymous() != null && comment.getIsAnonymous()) {
            comment.setUserNickname("익명");
            boolean mine = viewerEmail != null
                    && comment.getUserEmail() != null
                    && viewerEmail.equalsIgnoreCase(comment.getUserEmail());
            comment.setEditableByViewer(mine);
            comment.setUserEmail(null);
            return;
        }

        comment.setEditableByViewer(viewerEmail != null
                && comment.getUserEmail() != null
                && viewerEmail.equalsIgnoreCase(comment.getUserEmail()));
        attachUserNickname(comment);
    }
}
