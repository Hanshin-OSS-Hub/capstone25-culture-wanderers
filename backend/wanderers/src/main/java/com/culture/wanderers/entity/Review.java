// package com.culture.wanderers.entity;

// import jakarta.persistence.Entity; 
// import jakarta.persistence.GeneratedValue; 
// import jakarta.persistence.GenerationType; 
// import jakarta.persistence.Id; 
// import lombok.Getter; 
// import lombok.Setter;

// @Entity @Getter @Setter public class Review {
    
//     @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

// private String targetType;

// private Long targetId;

// private String targetTitle;

// private String title;

// private int rating;

// private String content;

// private java.time.LocalDate createdAt;


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

    // 작성자
    private String authorEmail;

    private String targetType;
    private Long targetId;
    private String targetTitle;

    private String title;
    private int rating;
    private String content;

    private LocalDate createdAt;
}