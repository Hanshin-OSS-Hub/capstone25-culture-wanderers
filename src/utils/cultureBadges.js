export const BADGES_PER_PAGE = 15;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const countCategoryVisits = (categoryStats, keywords) =>
  (Array.isArray(categoryStats) ? categoryStats : [])
    .filter((item) => keywords.some((keyword) => normalizeText(item.name).includes(normalizeText(keyword))))
    .reduce((sum, item) => sum + Number(item.count || 0), 0);

const countRegionVisits = (regionStats, keywords) =>
  (Array.isArray(regionStats) ? regionStats : [])
    .filter((item) => keywords.some((keyword) => normalizeText(item.name).includes(normalizeText(keyword))))
    .reduce((sum, item) => sum + Number(item.count || 0), 0);

const tier = (name, goal) => ({ name, goal });

const BADGE_FAMILIES = [
  {
    id: "visit",
    visual: "footprint",
    desc: "다녀왔어요 방문 기록",
    getValue: ({ totalVisits }) => totalVisits,
    tiers: [tier("첫 문화 발자국", 1), tier("문화 산책러", 10), tier("문화 탐험가", 30)],
  },
  {
    id: "monthly",
    visual: "sparkle",
    desc: "이번 달 방문",
    getValue: ({ thisMonthVisits }) => thisMonthVisits,
    tiers: [tier("이번 달 반짝", 1), tier("월간 문화러", 4), tier("월간 마스터", 10)],
  },
  {
    id: "region",
    visual: "map",
    desc: "서로 다른 지역 방문",
    getValue: ({ regionCount }) => regionCount,
    tiers: [tier("동네 산책가", 1), tier("지역 수집가", 4), tier("전국 유랑단", 10)],
  },
  {
    id: "exhibition",
    visual: "palette",
    desc: "전시·미술관 방문",
    getValue: ({ exhibitionVisits }) => exhibitionVisits,
    tiers: [tier("전시 새싹", 1), tier("전시 감상가", 5), tier("전시 마스터", 15)],
  },
  {
    id: "performance",
    visual: "music",
    desc: "공연·콘서트 방문",
    getValue: ({ performanceVisits }) => performanceVisits,
    tiers: [tier("공연 새싹", 1), tier("공연 단골", 5), tier("공연 마스터", 15)],
  },
  {
    id: "festival",
    visual: "ferris",
    desc: "축제·페스티벌 방문",
    getValue: ({ festivalVisits }) => festivalVisits,
    tiers: [tier("축제 새싹", 1), tier("축제 러버", 6), tier("축제 마스터", 18)],
  },
  {
    id: "museum",
    visual: "museum",
    desc: "박물관 방문",
    getValue: ({ museumVisits }) => museumVisits,
    tiers: [tier("박물관 입문가", 1), tier("박물관 탐험가", 4), tier("박물관 마스터", 12)],
  },
  {
    id: "food",
    visual: "market",
    desc: "먹거리·마켓 방문",
    getValue: ({ foodVisits }) => foodVisits,
    tiers: [tier("맛 산책러", 1), tier("맛과 문화 수집가", 5), tier("마켓 마스터", 15)],
  },
  {
    id: "review",
    visual: "pen",
    desc: "리뷰 작성",
    getValue: ({ stats }) => Number(stats.reviews || 0),
    tiers: [tier("리뷰 새싹", 1), tier("리뷰 메이트", 5), tier("리뷰 마스터", 15)],
  },
  {
    id: "party-post",
    visual: "heart",
    desc: "동행 모집글 작성",
    getValue: ({ stats }) => Number(stats.partyPosts || 0),
    tiers: [tier("동행 시작러", 1), tier("동행 리더", 3), tier("동행 마스터", 10)],
  },
  {
    id: "party-join",
    visual: "people",
    desc: "파티 참여",
    getValue: ({ stats }) => Number(stats.joinedParties || 0),
    tiers: [tier("동행 참가자", 1), tier("동행 메이트", 3), tier("동행 마스터", 10)],
  },
  {
    id: "save",
    visual: "bookmark",
    desc: "관심 행사 저장",
    getValue: ({ stats }) => Number(stats.savedEvents || 0),
    tiers: [tier("저장 새싹", 1), tier("저장 큐레이터", 10), tier("저장 마스터", 30)],
  },
  {
    id: "like",
    visual: "stamp",
    desc: "좋아요한 행사",
    getValue: ({ stats }) => Number(stats.likedEvents || 0),
    tiers: [tier("좋아요 새싹", 1), tier("취향 콜렉터", 10), tier("취향 마스터", 40)],
  },
  {
    id: "culture-score",
    visual: "crown",
    unit: "점",
    desc: "문화 점수",
    getValue: ({ cultureScore }) => cultureScore,
    tiers: [tier("문화 루키", 20), tier("문화 에이스", 80), tier("문화 마스터", 180)],
  },
  {
    id: "genre",
    visual: "leaf",
    desc: "서로 다른 장르 방문",
    getValue: ({ categoryCount }) => categoryCount,
    tiers: [tier("장르 새싹", 1), tier("장르 탐험가", 4), tier("장르 마스터", 8)],
  },
  {
    id: "stamp",
    visual: "route",
    desc: "지역과 장르를 함께 수집",
    getValue: ({ regionCount, categoryCount }) => Math.min(regionCount, categoryCount),
    tiers: [tier("도장 새싹", 1), tier("도장 수집가", 3), tier("도장 마스터", 7)],
  },
  {
    id: "seoul",
    visual: "map",
    desc: "서울 지역 방문",
    getValue: ({ seoulVisits }) => seoulVisits,
    tiers: [tier("서울 첫걸음", 1), tier("서울 산책러", 5), tier("서울 마스터", 15)],
  },
  {
    id: "gyeonggi",
    visual: "route",
    desc: "경기 지역 방문",
    getValue: ({ gyeonggiVisits }) => gyeonggiVisits,
    tiers: [tier("경기 첫걸음", 1), tier("경기 산책러", 5), tier("경기 마스터", 15)],
  },
  {
    id: "traditional",
    visual: "crown",
    desc: "전통·역사 문화 방문",
    getValue: ({ traditionalVisits }) => traditionalVisits,
    tiers: [tier("전통 새싹", 1), tier("역사 산책가", 4), tier("전통 마스터", 12)],
  },
  {
    id: "night",
    visual: "sparkle",
    desc: "야간·빛 문화 방문",
    getValue: ({ nightVisits }) => nightVisits,
    tiers: [tier("밤 산책러", 1), tier("야간 감상가", 3), tier("빛 축제 마스터", 10)],
  },
  {
    id: "family",
    visual: "people",
    desc: "가족·어린이 행사 방문",
    getValue: ({ familyVisits }) => familyVisits,
    tiers: [tier("가족 나들이", 1), tier("키즈 큐레이터", 4), tier("가족 문화 마스터", 12)],
  },
  {
    id: "experience",
    visual: "stamp",
    desc: "체험·클래스 방문",
    getValue: ({ experienceVisits }) => experienceVisits,
    tiers: [tier("체험 입문가", 1), tier("손끝 메이커", 4), tier("체험 마스터", 12)],
  },
  {
    id: "outdoor",
    visual: "leaf",
    desc: "야외·산책형 행사 방문",
    getValue: ({ outdoorVisits }) => outdoorVisits,
    tiers: [tier("야외 새싹", 1), tier("공원 산책가", 5), tier("야외 마스터", 15)],
  },
  {
    id: "indoor",
    visual: "museum",
    desc: "실내 문화공간 방문",
    getValue: ({ indoorVisits }) => indoorVisits,
    tiers: [tier("실내 탐방러", 1), tier("비 오는 날 친구", 6), tier("실내 문화 마스터", 18)],
  },
  {
    id: "market",
    visual: "market",
    desc: "플리마켓·장터 방문",
    getValue: ({ marketVisits }) => marketVisits,
    tiers: [tier("마켓 구경꾼", 1), tier("마켓 단골", 4), tier("마켓 큐레이터", 12)],
  },
  {
    id: "art-balance",
    visual: "palette",
    desc: "전시와 공연을 고르게 방문",
    getValue: ({ exhibitionVisits, performanceVisits }) => Math.min(exhibitionVisits, performanceVisits),
    tiers: [tier("감상 균형러", 1), tier("예술 밸런서", 4), tier("예술 올라운더", 12)],
  },
  {
    id: "festival-food",
    visual: "ferris",
    desc: "축제와 먹거리를 함께 방문",
    getValue: ({ festivalVisits, foodVisits }) => Math.min(festivalVisits, foodVisits),
    tiers: [tier("축제 한입", 1), tier("축제 미식가", 4), tier("페스티벌 미식왕", 12)],
  },
  {
    id: "community",
    visual: "heart",
    unit: "개",
    desc: "리뷰·동행 활동 합산",
    getValue: ({ stats }) =>
      Number(stats.reviews || 0) + Number(stats.partyPosts || 0) + Number(stats.joinedParties || 0),
    tiers: [tier("커뮤니티 새싹", 1), tier("문화 연결자", 8), tier("커뮤니티 마스터", 25)],
  },
  {
    id: "collector",
    visual: "bookmark",
    unit: "개",
    desc: "저장과 좋아요 합산",
    getValue: ({ stats }) => Number(stats.savedEvents || 0) + Number(stats.likedEvents || 0),
    tiers: [tier("취향 보관함", 2), tier("취향 큐레이터", 20), tier("컬렉션 마스터", 60)],
  },
  {
    id: "grand-master",
    visual: "crown",
    unit: "개",
    desc: "방문·리뷰·저장·동행 합산",
    getValue: ({ totalVisits, stats }) =>
      totalVisits +
      Number(stats.reviews || 0) +
      Number(stats.savedEvents || 0) +
      Number(stats.likedEvents || 0) +
      Number(stats.partyPosts || 0) +
      Number(stats.joinedParties || 0),
    tiers: [tier("문화 수집 입문", 5), tier("문화 수집가", 40), tier("문화 그랜드마스터", 120)],
  },
];

export function buildCultureBadges(journey, stats = {}) {
  const categoryStats = Array.isArray(journey?.categoryStats) ? journey.categoryStats : [];
  const regionStats = Array.isArray(journey?.regionStats) ? journey.regionStats : [];
  const context = {
    stats,
    totalVisits: Number(journey?.totalVisits || 0),
    thisMonthVisits: Number(journey?.thisMonthVisits || 0),
    regionCount: regionStats.length,
    categoryCount: categoryStats.length,
    cultureScore: Number(journey?.cultureScore || 0),
    exhibitionVisits: countCategoryVisits(categoryStats, ["전시", "전시회", "미술관"]),
    performanceVisits: countCategoryVisits(categoryStats, ["공연", "콘서트", "연극", "뮤지컬"]),
    festivalVisits: countCategoryVisits(categoryStats, ["축제", "페스티벌"]),
    museumVisits: countCategoryVisits(categoryStats, ["박물관"]),
    foodVisits: countCategoryVisits(categoryStats, ["먹거리", "플리마켓", "마켓"]),
    seoulVisits: countRegionVisits(regionStats, ["서울"]),
    gyeonggiVisits: countRegionVisits(regionStats, ["경기"]),
    traditionalVisits: countCategoryVisits(categoryStats, ["전통", "역사", "국악", "문화재", "궁", "사찰"]),
    nightVisits: countCategoryVisits(categoryStats, ["야간", "밤", "빛", "라이트", "미디어아트"]),
    familyVisits: countCategoryVisits(categoryStats, ["가족", "어린이", "키즈", "아동"]),
    experienceVisits: countCategoryVisits(categoryStats, ["체험", "클래스", "원데이", "워크숍"]),
    outdoorVisits: countCategoryVisits(categoryStats, ["야외", "산책", "공원", "꽃", "정원"]),
    indoorVisits: countCategoryVisits(categoryStats, ["전시", "미술관", "박물관", "공연", "극장", "도서관"]),
    marketVisits: countCategoryVisits(categoryStats, ["플리마켓", "마켓", "장터", "시장"]),
  };

  return BADGE_FAMILIES.map((badge) => {
    const value = Math.max(0, Number(badge.getValue(context) || 0));
    const level = badge.tiers.reduce((current, item, index) => (value >= item.goal ? index + 1 : current), 0);
    const currentTier = level > 0 ? badge.tiers[level - 1] : badge.tiers[0];
    const nextTier = badge.tiers[Math.min(level, badge.tiers.length - 1)];
    const isMaxed = level >= badge.tiers.length;
    const goal = isMaxed ? currentTier.goal : nextTier.goal;

    return {
      ...badge,
      name: currentTier.name,
      level,
      maxLevel: badge.tiers.length,
      unlocked: level > 0,
      isMaxed,
      progress: Math.min(value, goal),
      rawProgress: value,
      goal,
      nextName: isMaxed ? currentTier.name : nextTier.name,
      tierLabel: level > 0 ? `${level}단계` : "잠김",
    };
  });
}

export function getBadgeProgressSummary(badges) {
  const safeBadges = Array.isArray(badges) ? badges : [];
  const unlockedCount = safeBadges.filter((badge) => badge.unlocked).length;
  const totalTierPoints = safeBadges.reduce((sum, badge) => sum + Number(badge.level || 0), 0);
  const maxTierPoints = safeBadges.reduce((sum, badge) => sum + Number(badge.maxLevel || 3), 0) || 1;
  const collectionRate = Math.round((totalTierPoints / maxTierPoints) * 100);
  const topPercent = Math.max(1, Math.min(99, 100 - collectionRate));
  const nextBadge = safeBadges
    .filter((badge) => !badge.isMaxed)
    .sort((a, b) => a.goal - a.rawProgress - (b.goal - b.rawProgress))[0];

  return {
    unlockedCount,
    collectionRate,
    topPercent,
    nextBadge,
  };
}
