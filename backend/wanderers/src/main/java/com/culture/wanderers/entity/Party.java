// package com.culture.wanderers.entity;
// import jakarta.persistence.*;
// import lombok.Getter;
// import lombok.Setter;
// import java.time.LocalDateTime;
// @Entity @Getter @Setter public class Party {
//     @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
//     private String title;
//     private String content;
//     private String category; // 공연, 전시 등
//     private int maxPeople; // 모집 인원
//     private int currentPeople; // 현재 참여 인원
//     private LocalDateTime meetingTime; // 만날 시간
//     private String location; // 만날 장소
//     private String status; // 모집중, 마감 등
//     private LocalDateTime createdAt;
// }
package com.culture.wanderers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Party {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 작성자
    private String authorEmail;

    private String title;
    private String content;
    private String category; // 공연, 전시 등
    private int maxPeople; // 모집 인원
    private int currentPeople; // 현재 참여 인원
    private LocalDateTime meetingTime; // 만날 시간
    private String location; // 만날 장소
    private String status; // 모집중, 마감 등
    private LocalDateTime createdAt;
    
}