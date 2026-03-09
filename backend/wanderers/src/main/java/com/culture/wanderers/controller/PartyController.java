// package com.culture.wanderers.controller;

// import com.culture.wanderers.entity.Party;
// import com.culture.wanderers.repository.PartyRepository;
// import org.springframework.http.HttpStatus;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.server.ResponseStatusException;

// import java.time.LocalDateTime;
// import java.util.List;

// @RestController
// @CrossOrigin(origins = "*")
// public class PartyController {

//     private final PartyRepository partyRepository;

//     public PartyController(PartyRepository partyRepository) {
//         this.partyRepository = partyRepository;
//     }

//     @GetMapping("/api/me/party-posts")
//     public List<Party> getMyPartyPosts() {
//         // 아직 작성자 필드 없으니 전체 반환 (나중에 JWT 붙이면 변경)
//         return partyRepository.findAll();
//     }

//     @PostMapping("/api/party-posts")
//     public Party createParty(@RequestBody Party party) {
//         party.setCreatedAt(LocalDateTime.now());
//         return partyRepository.save(party);
//     }

//     @PatchMapping("/api/party-posts/{id}")
//     public Party updateParty(@PathVariable Long id, @RequestBody Party detail) {

//         Party party = partyRepository.findById(id)
//                 .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티글 없음"));

//         party.setTitle(detail.getTitle());
//         party.setContent(detail.getContent());
//         party.setStatus(detail.getStatus());

//         return partyRepository.save(party);
//     }

//     @DeleteMapping("/api/party-posts/{id}")
//     public void deleteParty(@PathVariable Long id) {
//         if (!partyRepository.existsById(id)) {
//             throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파티글 없음");
//         }
//         partyRepository.deleteById(id);
//     }
// }

package com.culture.wanderers.controller;

import com.culture.wanderers.entity.Party;
import com.culture.wanderers.jwt.JwtUtil;
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
    private final JwtUtil jwtUtil;

    public PartyController(PartyRepository partyRepository, JwtUtil jwtUtil) {
        this.partyRepository = partyRepository;
        this.jwtUtil = jwtUtil;
    }

    // 내 파티글 조회
    @GetMapping("/api/me/party-posts")
    public List<Party> getMyPartyPosts(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);
        return partyRepository.findByAuthorEmail(email);
    }

    // 파티글 생성 (작성자/작성시간 서버에서 자동 세팅)
    @PostMapping("/api/party-posts")
    public Party createParty(
            @RequestBody Party party,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        party.setAuthorEmail(email);
        party.setCreatedAt(LocalDateTime.now());

        // currentPeople 같은 값도 기본값 세팅하고 싶으면 여기서 가능
        // party.setCurrentPeople(0);

        return partyRepository.save(party);
    }

    // 파티글 수정 (내 글인지 체크하고 싶다면 authorEmail 검사도 추가 가능)
    @PatchMapping("/api/party-posts/{id}")
    public Party updateParty(
            @PathVariable Long id,
            @RequestBody Party detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티글 없음"));

        // (선택) 내 글만 수정 가능하게 막기
        if (party.getAuthorEmail() == null || !party.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 수정 가능");
        }

        party.setTitle(detail.getTitle());
        party.setContent(detail.getContent());
        party.setStatus(detail.getStatus());
        party.setCategory(detail.getCategory());
        party.setMaxPeople(detail.getMaxPeople());
        party.setCurrentPeople(detail.getCurrentPeople());
        party.setMeetingTime(detail.getMeetingTime());
        party.setLocation(detail.getLocation());

        return partyRepository.save(party);
    }

    // 파티글 삭제 (내 글인지 체크)
    @DeleteMapping("/api/party-posts/{id}")
    public void deleteParty(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmailFromHeader(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티글 없음"));

        if (party.getAuthorEmail() == null || !party.getAuthorEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "내 글만 삭제 가능");
        }

        partyRepository.deleteById(id);
    }

    // 공통: 헤더에서 이메일 추출
    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 없음");
        }

        try {
            String token = authHeader.substring(7);
            return jwtUtil.extractEmail(token);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰 오류/만료");
        }
    }
}