// package com.culture.wanderers.entity;

// import jakarta.persistence.*;
// import lombok.Getter;
// import lombok.Setter;

// import java.time.LocalDate;

// @Entity
// @Getter
// @Setter
// public class Review {

//     @Id
//     @GeneratedValue(strategy = GenerationType.IDENTITY)
//     private Long id;

//     // 작성자
//     private String authorEmail;

//     private String targetType;
//     private Long targetId;
//     private String targetTitle;

//     private String title;
//     private int rating;
//     private String content;

//     private LocalDate createdAt;
// }
package com.culture.wanderers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자 (JWT에서 추출한 이메일)
    @Column(nullable = false)
    private String authorEmail;

    // festival 또는 party
    @Column(nullable = false)
    private String targetType;

    // 축제 id 또는 파티 id
    private Long targetId;

    // 화면 표시용 제목
    private String targetTitle;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDate createdAt;

    @Transient
    private Long commentCount;
}
