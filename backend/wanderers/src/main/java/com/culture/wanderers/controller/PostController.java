package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Post;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.PostRepository;
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
public class PostController {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final JwtUtil jwtUtil;

    public PostController(PostRepository postRepository, CommentRepository commentRepository, JwtUtil jwtUtil) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/api/posts")
    public List<Post> getPosts(@RequestParam(value = "type", required = false) String type) {
        List<Post> posts = type != null && !type.isBlank()
                ? postRepository.findByTypeOrderByCreatedAtDesc(type.toUpperCase())
                : postRepository.findAllByOrderByCreatedAtDesc();

        posts.forEach(this::attachCommentCount);
        return posts;
    }

    @GetMapping("/api/posts/{id}")
    public Post getPost(@PathVariable Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글 없음"));

        post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);
        Post saved = postRepository.save(post);
        attachCommentCount(saved);
        return saved;
    }

    @PostMapping("/api/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public Post createPost(
            @RequestBody Post post,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        if (post.getTitle() == null || post.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 필수입니다.");
        }
        if (post.getContent() == null || post.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 필수입니다.");
        }

        post.setUserEmail(email);
        post.setType(post.getType() == null || post.getType().isBlank() ? "QUESTION" : post.getType().toUpperCase());
        post.setViewCount(0);
        post.setCreatedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    @GetMapping("/api/me/posts")
    public List<Post> getMyPosts(
            @RequestHeader(name = "Authorization", required = false) String authHeader,
            @RequestParam(value = "type", required = false, defaultValue = "QUESTION") String type
    ) {
        String email = extractEmailFromHeader(authHeader);
        String normalizedType = (type == null || type.isBlank()) ? "QUESTION" : type.toUpperCase();
        List<Post> posts = postRepository.findByUserEmailAndTypeOrderByCreatedAtDesc(email, normalizedType);
        posts.forEach(this::attachCommentCount);
        return posts;
    }

    @PatchMapping("/api/posts/{id}")
    public Post updatePost(
            @PathVariable Long id,
            @RequestBody Post detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글 없음"));

        if (post.getUserEmail() == null || !post.getUserEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 수정할 수 있습니다.");
        }

        if (detail.getTitle() == null || detail.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 필수입니다.");
        }
        if (detail.getContent() == null || detail.getContent().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 필수입니다.");
        }

        post.setTitle(detail.getTitle().trim());
        post.setContent(detail.getContent().trim());
        post.setRegionTag(detail.getRegionTag());

        return postRepository.save(post);
    }

    @DeleteMapping("/api/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePost(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글 없음"));

        if (post.getUserEmail() == null || !post.getUserEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 삭제할 수 있습니다.");
        }

        postRepository.deleteById(id);
    }

    private void attachCommentCount(Post post) {
        if (post == null || post.getId() == null) {
            return;
        }
        long count = commentRepository.countByTargetTypeAndTargetId("POST", post.getId());
        post.setCommentCount(count);
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
}
