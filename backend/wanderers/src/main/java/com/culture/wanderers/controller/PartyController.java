package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.PartyMember;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.PartyMemberRepository;
import com.culture.wanderers.repository.PartyRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class PartyController {

    private final PartyRepository partyRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final JwtUtil jwtUtil;

    public PartyController(
            PartyRepository partyRepository,
            PartyMemberRepository partyMemberRepository,
            JwtUtil jwtUtil
    ) {
        this.partyRepository = partyRepository;
        this.partyMemberRepository = partyMemberRepository;
        this.jwtUtil = jwtUtil;
    }

    // 내가 작성한 파티글
    @GetMapping("/api/me/party-posts")
    public List<Party> getMyPartyPosts(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        return partyRepository.findByAuthorEmail(email);
    }

    // 축제별 전체 모집중 파티글 (festivalId 기준)
    @GetMapping("/api/party-posts/festival/{festivalId}")
    public List<Party> getPartyPostsByFestival(@PathVariable Long festivalId) {
        return partyRepository.findByFestivalIdAndStatus(festivalId, "RECRUITING");
    }

    // 축제별 전체 모집중 파티글 (festivalTitle 기준 fallback)
    @GetMapping("/api/party-posts/festival-title")
    public List<Party> getPartyPostsByFestivalTitle(@RequestParam String festivalTitle) {
        return partyRepository.findByFestivalTitleAndStatus(festivalTitle, "RECRUITING");
    }

    // 내가 참여한 파티
    @GetMapping("/api/me/parties")
    public List<Party> getMyParties(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        List<PartyMember> list = partyMemberRepository.findByUserEmail(email);

        return list.stream()
                .map(PartyMember::getParty)
                .toList();
    }

    // 파티 생성
    @PostMapping("/api/party-posts")
    public Party createParty(
            @RequestBody Party party,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        party.setAuthorEmail(email);
        party.setCreatedAt(LocalDateTime.now());
        party.setCurrentPeople(1);

        return partyRepository.save(party);
    }

    // 파티 참여
    @PostMapping("/api/parties/{id}/join")
    public PartyMember joinParty(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티 없음"));

        if (partyMemberRepository.existsByUserEmailAndParty_Id(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 참여함");
        }

        if (party.getCurrentPeople() >= party.getMaxPeople()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 인원이 가득 찼습니다.");
        }

        PartyMember member = new PartyMember();
        member.setUserEmail(email);
        member.setParty(party);

        party.setCurrentPeople(party.getCurrentPeople() + 1);
        partyRepository.save(party);

        return partyMemberRepository.save(member);
    }

    // 수정
    @PatchMapping("/api/party-posts/{id}")
    public Party updateParty(
            @PathVariable Long id,
            @RequestBody Party detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티 없음"));

        if (party.getAuthorEmail() == null || !email.equals(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 수정 가능");
        }

        party.setTitle(detail.getTitle());
        party.setContent(detail.getContent());
        party.setCategory(detail.getCategory());
        party.setMaxPeople(detail.getMaxPeople());
        party.setMeetingTime(detail.getMeetingTime());
        party.setLocation(detail.getLocation());
        party.setStatus(detail.getStatus());
        party.setFestivalId(detail.getFestivalId());
        party.setFestivalTitle(detail.getFestivalTitle());

        return partyRepository.save(party);
    }

    // 삭제
    @DeleteMapping("/api/party-posts/{id}")
    public void deleteParty(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티 없음"));

        if (party.getAuthorEmail() == null || !email.equals(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 삭제 가능");
        }

        partyRepository.deleteById(id);
    }

    // 공통 토큰 처리
    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류");
        }
    }
}