package com.culture.wanderers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "user_likes")
public class UserLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // JWT에서 추출한 사용자 이메일
    @Column(nullable = false)
    private String userEmail;

    // festival 또는 party
    @Column(nullable = false)
    private String targetType;

    // 축제 id 또는 파티 id
    @Column(nullable = false)
    private Long targetId;
}