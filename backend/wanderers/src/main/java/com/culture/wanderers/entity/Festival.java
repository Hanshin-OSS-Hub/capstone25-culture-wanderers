package com.culture.wanderers.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "festivals")
@Getter
@Setter
@NoArgsConstructor
public class Festival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String region;
    private String location;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "end_date")
    private String endDate;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    private String category;
    private String price;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;
    private String tel;

    @Column(name = "homepage_url")
    private String homepageUrl;
}
