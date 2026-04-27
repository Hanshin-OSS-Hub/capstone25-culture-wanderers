package com.culture.wanderers.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.culture.wanderers.entity.Party;
import com.culture.wanderers.entity.PartyMember;
import com.culture.wanderers.entity.Festival;
import com.culture.wanderers.jwt.JwtUtil;
import com.culture.wanderers.repository.CommentRepository;
import com.culture.wanderers.repository.FestivalRepository;
import com.culture.wanderers.repository.PartyMemberRepository;
import com.culture.wanderers.repository.PartyRepository;
import com.culture.wanderers.repository.UserRepository;
import com.culture.wanderers.service.UserActivityService;

@RestController
@CrossOrigin(origins = "*")
public class PartyController {

    private final PartyRepository partyRepository;
    private final PartyMemberRepository partyMemberRepository;
    private final CommentRepository commentRepository;
    private final FestivalRepository festivalRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserActivityService userActivityService;

    public PartyController(
            PartyRepository partyRepository,
            PartyMemberRepository partyMemberRepository,
            CommentRepository commentRepository,
            FestivalRepository festivalRepository,
            UserRepository userRepository,
            JwtUtil jwtUtil,
            UserActivityService userActivityService
    ) {
        this.partyRepository = partyRepository;
        this.partyMemberRepository = partyMemberRepository;
        this.commentRepository = commentRepository;
        this.festivalRepository = festivalRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.userActivityService = userActivityService;
    }

    @GetMapping("/api/me/party-posts")
    public List<Party> getMyPartyPosts(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);
        List<Party> parties = partyRepository.findByAuthorEmail(email);
        parties.forEach(this::attachPartyMetadata);
        return parties;
    }

    @GetMapping("/api/party-posts/festival/{festivalId}")
    public List<Party> getPartyPostsByFestival(@PathVariable Long festivalId) {
        List<Party> parties = partyRepository.findByFestivalId(festivalId);
        parties.forEach(this::attachPartyMetadata);
        return parties.stream()
                .filter(party -> "RECRUITING".equalsIgnoreCase(party.getStatus()))
                .toList();
    }

    @GetMapping("/api/party-posts/festival-title")
    public List<Party> getPartyPostsByFestivalTitle(@RequestParam String festivalTitle) {
        List<Party> parties = partyRepository.findAll().stream()
                .filter(party -> festivalTitle.equals(party.getFestivalTitle()))
                .toList();
        parties.forEach(this::attachPartyMetadata);
        return parties.stream()
                .filter(party -> "RECRUITING".equalsIgnoreCase(party.getStatus()))
                .toList();
    }

    @GetMapping("/api/me/parties")
    public List<Party> getMyParties(
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        List<PartyMember> members = partyMemberRepository.findByUserEmailAndStatus(email, "APPROVED");
        List<Party> parties = members.stream().map(PartyMember::getParty).toList();
        parties.forEach(this::attachPartyMetadata);
        return parties;
    }

    @PostMapping("/api/party-posts")
    public Party createParty(
            @RequestBody Party party,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        party.setAuthorEmail(email);
        party.setCreatedAt(LocalDateTime.now());
        party.setCurrentPeople(1);
        syncPartyStatus(party);

        Party saved = partyRepository.save(party);
        attachPartyMetadata(saved);
        return saved;
    }

    @PatchMapping("/api/party-posts/{id}/festival-link")
    public Party linkFestival(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));

        if (party.getAuthorEmail() == null || !email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 축제 연결을 변경할 수 있습니다.");
        }

        Long festivalId = longValue(body == null ? null : body.get("festivalId"));
        if (festivalId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연결할 축제 정보가 없습니다.");
        }

        Festival festival = festivalRepository.findById(festivalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "축제를 찾을 수 없습니다."));

        party.setFestivalId(festival.getId());
        party.setFestivalTitle(festival.getTitle());
        Party saved = partyRepository.save(party);
        attachPartyMetadata(saved);
        return saved;
    }

    @GetMapping("/api/party-posts")
    public List<Party> getAllParties() {
        List<Party> parties = partyRepository.findAll();
        parties.forEach(this::attachPartyMetadata);
        return parties;
    }

    @PostMapping("/api/parties/{id}/join")
    public PartyMember joinParty(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));
        attachPartyMetadata(party);

        if (!"RECRUITING".equalsIgnoreCase(party.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집이 마감된 파티입니다.");
        }

        if (party.getAuthorEmail() != null && email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "작성자는 자신의 파티에 참여 신청할 수 없습니다.");
        }

        if (partyMemberRepository.existsByUserEmailAndParty_Id(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 참여 신청한 파티입니다.");
        }

        if (party.getCurrentPeople() >= party.getMaxPeople()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 인원이 모두 찼습니다.");
        }

        PartyMember member = new PartyMember();
        member.setUserEmail(email);
        member.setParty(party);
        member.setMessage(stringValue(body == null ? null : body.get("message")));
        member.setAge(integerValue(body == null ? null : body.get("age")));
        member.setGender(stringValue(body == null ? null : body.get("gender")));
        member.setStatus("PENDING");
        member.setCreatedAt(LocalDateTime.now());

        PartyMember saved = partyMemberRepository.save(member);
        attachApplicantMetadata(saved);
        return saved;
    }

    @GetMapping("/api/party-posts/{id}/applications")
    public List<PartyMember> getPartyApplications(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));

        if (party.getAuthorEmail() == null || !email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 신청 목록을 볼 수 있습니다.");
        }

        List<PartyMember> members = partyMemberRepository.findByParty_IdOrderByCreatedAtAsc(id);
        members.forEach(this::attachApplicantMetadata);
        return members;
    }

    @PostMapping("/api/party-posts/{id}/applications/{memberId}/approve")
    public PartyMember approvePartyApplication(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));

        if (party.getAuthorEmail() == null || !email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 신청을 수락할 수 있습니다.");
        }

        attachPartyMetadata(party);
        if (!"RECRUITING".equalsIgnoreCase(party.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집이 마감된 파티입니다.");
        }

        PartyMember member = partyMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "신청 정보를 찾을 수 없습니다."));

        if (member.getParty() == null || !id.equals(member.getParty().getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이 파티의 신청 정보가 아닙니다.");
        }

        if ("APPROVED".equalsIgnoreCase(member.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 수락된 신청입니다.");
        }

        if (party.getCurrentPeople() >= party.getMaxPeople()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "모집 인원이 모두 찼습니다.");
        }

        member.setStatus("APPROVED");
        member.setApprovedAt(LocalDateTime.now());
        party.setCurrentPeople(party.getCurrentPeople() + 1);
        syncPartyStatus(party);
        partyRepository.save(party);

        PartyMember saved = partyMemberRepository.save(member);
        userActivityService.save(member.getUserEmail(), "party_join", party.getFestivalId(), party.getCategory(), null, party.getFestivalTitle());
        attachApplicantMetadata(saved);
        return saved;
    }

    @PatchMapping("/api/party-posts/{id}")
    public Party updateParty(
            @PathVariable Long id,
            @RequestBody Party detail,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));

        if (party.getAuthorEmail() == null || !email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 수정할 수 있습니다.");
        }

        party.setTitle(detail.getTitle());
        party.setContent(detail.getContent());
        party.setCategory(detail.getCategory());
        party.setMaxPeople(detail.getMaxPeople());
        party.setMeetingTime(detail.getMeetingTime());
        party.setDeadline(detail.getDeadline());
        party.setLocation(detail.getLocation());
        party.setContact(detail.getContact());
        party.setFestivalId(detail.getFestivalId());
        party.setFestivalTitle(detail.getFestivalTitle());
        syncPartyStatus(party);

        Party saved = partyRepository.save(party);
        attachPartyMetadata(saved);
        return saved;
    }

    @DeleteMapping("/api/party-posts/{id}")
    public void deleteParty(
            @PathVariable Long id,
            @RequestHeader(name = "Authorization", required = false) String authHeader
    ) {
        String email = extractEmail(authHeader);

        Party party = partyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "파티가 없습니다."));

        if (party.getAuthorEmail() == null || !email.equalsIgnoreCase(party.getAuthorEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 삭제할 수 있습니다.");
        }

        partyRepository.deleteById(id);
    }

    private String extractEmail(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 없습니다.");
        }

        try {
            return jwtUtil.extractEmail(authHeader.substring(7));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "토큰이 올바르지 않습니다.");
        }
    }

    private void attachPartyMetadata(Party party) {
        if (party == null || party.getId() == null) {
            return;
        }

        resolveFestivalLink(party);

        String previousStatus = party.getStatus();
        syncPartyStatus(party);
        if (previousStatus == null || !previousStatus.equalsIgnoreCase(party.getStatus())) {
            partyRepository.save(party);
        }

        long commentCount = commentRepository.countByTargetTypeAndTargetId("PARTY", party.getId());
        party.setCommentCount(commentCount);

        if (party.getAuthorEmail() != null && !party.getAuthorEmail().isBlank()) {
            String fallback = party.getAuthorEmail().contains("@")
                    ? party.getAuthorEmail().split("@")[0]
                    : party.getAuthorEmail();

            String nickname = userRepository.findByEmail(party.getAuthorEmail())
                    .map(user -> user.getNickname())
                    .filter(name -> name != null && !name.isBlank())
                    .orElse(fallback);

            party.setAuthorNickname(nickname);
        }
    }

    private void resolveFestivalLink(Party party) {
        if (party == null) {
            return;
        }

        if (party.getFestivalId() != null) {
            festivalRepository.findById(party.getFestivalId()).ifPresent(festival -> {
                party.setFestivalTitle(festival.getTitle());
            });
            return;
        }

        List<String> queries = java.util.stream.Stream.of(
                stringValue(party.getFestivalTitle()),
                stringValue(party.getTitle())
        ).filter(value -> value != null && !value.isBlank()).distinct().toList();

        if (queries.isEmpty()) {
            return;
        }

        String normalizedRegion = normalizeLooseText(party.getLocation());

        Festival matched = festivalRepository.findAll().stream()
                .filter(festival -> {
                    String festivalTitle = normalizeLooseText(festival.getTitle());
                    if (festivalTitle.isBlank()) {
                        return false;
                    }

                    return queries.stream()
                            .map(this::normalizeLooseText)
                            .anyMatch(query -> !query.isBlank() && hasLooseTitleMatch(festivalTitle, query));
                })
                .sorted((a, b) -> Integer.compare(
                        festivalMatchScore(b, queries, normalizedRegion),
                        festivalMatchScore(a, queries, normalizedRegion)
                ))
                .findFirst()
                .orElse(null);

        if (matched != null) {
            party.setFestivalId(matched.getId());
            party.setFestivalTitle(matched.getTitle());
            partyRepository.save(party);
        }
    }

    private int festivalMatchScore(Festival festival, List<String> queries, String normalizedRegion) {
        String festivalTitle = normalizeLooseText(festival.getTitle());
        String festivalRegion = normalizeLooseText(festival.getRegion());
        String festivalLocation = normalizeLooseText(festival.getLocation());

        int score = 0;
        for (String queryValue : queries) {
            String query = normalizeLooseText(queryValue);
            if (query.isBlank()) {
                continue;
            }
            double ratio = titleSimilarityRatio(festivalTitle, query);
            if (festivalTitle.equals(query)) {
                score += 200;
            }
            if (query.contains(festivalTitle)) {
                score += 120;
            }
            if (festivalTitle.contains(query)) {
                score += 80;
            }
            score += (int) Math.round(ratio * 100);
        }

        if (!normalizedRegion.isBlank() && (festivalRegion.contains(normalizedRegion) || festivalLocation.contains(normalizedRegion))) {
            score += 30;
        }

        score += Math.min(festivalTitle.length(), 60);
        return score;
    }

    private boolean hasLooseTitleMatch(String festivalTitle, String query) {
        if (festivalTitle.isBlank() || query.isBlank()) {
            return false;
        }
        if (query.contains(festivalTitle) || festivalTitle.contains(query)) {
            return true;
        }
        return titleSimilarityRatio(festivalTitle, query) >= 0.5;
    }

    private double titleSimilarityRatio(String left, String right) {
        if (left == null || right == null || left.isBlank() || right.isBlank()) {
            return 0.0;
        }
        int commonLength = longestCommonSubstringLength(left, right);
        int shorterLength = Math.min(left.length(), right.length());
        if (shorterLength == 0) {
            return 0.0;
        }
        return (double) commonLength / shorterLength;
    }

    private int longestCommonSubstringLength(String left, String right) {
        int[][] dp = new int[left.length() + 1][right.length() + 1];
        int max = 0;

        for (int i = 1; i <= left.length(); i++) {
            for (int j = 1; j <= right.length(); j++) {
                if (left.charAt(i - 1) == right.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    max = Math.max(max, dp[i][j]);
                }
            }
        }

        return max;
    }

    private void attachApplicantMetadata(PartyMember member) {
        if (member == null || member.getUserEmail() == null || member.getUserEmail().isBlank()) {
            return;
        }

        String fallback = member.getUserEmail().contains("@")
                ? member.getUserEmail().split("@")[0]
                : member.getUserEmail();

        String nickname = userRepository.findByEmail(member.getUserEmail())
                .map(user -> user.getNickname())
                .filter(name -> name != null && !name.isBlank())
                .orElse(fallback);

        member.setUserNickname(nickname);
    }

    private String stringValue(Object value) {
        return value == null ? null : String.valueOf(value).trim();
    }

    private Integer integerValue(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Integer.parseInt(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }

        try {
            return Long.parseLong(String.valueOf(value).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizeLooseText(String value) {
        if (value == null) {
            return "";
        }

        return value
                .toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^0-9a-z가-힣]", "");
    }

    private void syncPartyStatus(Party party) {
        if (party == null) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        if (party.getCurrentPeople() >= party.getMaxPeople()) {
            party.setStatus("CLOSED");
            return;
        }

        if (party.getDeadline() != null && now.isAfter(party.getDeadline())) {
            party.setStatus("CLOSED");
            return;
        }

        if (party.getMeetingTime() != null && now.isAfter(party.getMeetingTime())) {
            party.setStatus("CLOSED");
            return;
        }

        party.setStatus("RECRUITING");
    }
}
