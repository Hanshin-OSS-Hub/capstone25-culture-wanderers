package com.culture.wanderers.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "party_member")
public class PartyMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;

    private String message;

    private Integer age;

    private String gender;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime approvedAt;

    @ManyToOne
    @JoinColumn(name = "party_id")
    private Party party;

    @Transient
    private String userNickname;
}
