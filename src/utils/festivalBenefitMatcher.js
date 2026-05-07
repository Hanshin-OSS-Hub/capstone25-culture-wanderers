const EXACT_BENEFIT_RULES = [
  {
    id: "seoul-public-museum-art-free",
    title: "서울 공립 박물관·미술관 무료관람",
    reason: "해당 기관 무료관람",
    summary:
      "서울시립 사진미술관처럼 서울 공립 박물관·미술관에 해당하는 문화공간은 무료 관람 또는 무료 중심 관람 정보를 확인할 수 있어요.",
    url: "/benefits/cat-4",
    keywords: [
      "서울시립사진미술관",
      "서울시립 사진미술관",
      "서울사진미술관",
      "서울시립미술관",
      "서울시립 미술관",
      "서울공예박물관",
      "서울공예 박물관",
      "서울역사박물관",
      "서울역사 박물관",
      "서울우리소리박물관",
      "서울 우리소리 박물관",
      "경교장",
      "백인제가옥",
    ],
  },
  {
    id: "royal-palace-free-entry",
    title: "궁능 무료 개방",
    reason: "궁능 관람 혜택",
    summary:
      "경복궁·창덕궁·덕수궁·종묘 등 궁능 행사라면 만 24세 이하, 만 65세 이상 등 무료관람 대상 여부를 확인할 수 있어요. 별도 체험·특별행사 비용은 제외될 수 있어요.",
    url: "/benefits/cat-4",
    keywords: [
      "경복궁",
      "창덕궁",
      "창경궁",
      "덕수궁",
      "종묘",
      "조선왕릉",
      "궁중문화축전",
      "경복궁생과방",
      "창덕궁달빛기행",
      "덕수궁밤의석조전",
      "종묘묘현례",
    ],
  },
  {
    id: "kofa-free-cinema",
    title: "시네마테크KOFA 무료 영화 상영",
    reason: "해당 영화관 무료상영",
    summary: "한국영상자료원 시네마테크KOFA 상영 행사라면 무료 상영 일정과 예매 방식을 확인할 수 있어요.",
    url: "/benefits/cat-4",
    keywords: ["시네마테크kofa", "시네마테크 kofa", "한국영상자료원", "kofa"],
  },
  {
    id: "national-museum-free",
    title: "국립중앙박물관 무료관람",
    reason: "국립박물관 무료관람",
    summary: "국립중앙박물관과 소속 국립박물관 상설전시는 무료 관람이 가능해요. 어린이박물관과 단체 관람은 예약 여부를 확인하세요.",
    url: "/benefits/cat-7",
    keywords: [
      "국립중앙박물관",
      "국립경주박물관",
      "국립광주박물관",
      "국립전주박물관",
      "국립대구박물관",
      "국립부여박물관",
      "국립공주박물관",
      "국립진주박물관",
      "국립청주박물관",
      "국립김해박물관",
      "국립제주박물관",
      "국립춘천박물관",
      "국립나주박물관",
      "국립익산박물관",
    ],
  },
  {
    id: "mmca-free-discount",
    title: "국립현대미술관 무료·할인",
    reason: "국립미술관 무료·할인",
    summary: "국립현대미술관 전시라면 만 24세 이하, 대학생, 문화누리카드·예술인패스 소지자 무료·할인 여부를 확인할 수 있어요.",
    url: "/benefits/cat-7",
    keywords: [
      "국립현대미술관",
      "국립현대미술관서울",
      "국립현대미술관과천",
      "국립현대미술관덕수궁",
      "국립현대미술관청주",
      "mmca",
    ],
  },
  {
    id: "national-folk-museum-free",
    title: "국립민속박물관 무료관람",
    reason: "국립민속박물관 무료",
    summary: "국립민속박물관 본관·파주관·어린이박물관은 무료 관람 정보를 확인할 수 있어요. 어린이박물관은 예약 여부를 같이 확인하세요.",
    url: "/benefits/cat-7",
    keywords: ["국립민속박물관", "국립민속박물관파주", "국립민속어린이박물관"],
  },
  {
    id: "history-museum-free",
    title: "대한민국역사박물관 무료관람",
    reason: "국립박물관 무료관람",
    summary: "대한민국역사박물관 전시라면 무료 관람과 프로그램 운영 정보를 확인할 수 있어요.",
    url: "/benefits/cat-7",
    keywords: ["대한민국역사박물관"],
  },
  {
    id: "gwacheon-science-benefit",
    title: "국립과천과학관 관람료 할인",
    reason: "과학관 관람 할인",
    summary: "국립과천과학관 행사라면 어린이·청소년 관람료, 문화가 있는 날 할인, 무료 대상 여부를 확인할 수 있어요.",
    url: "/benefits/cat-8",
    keywords: ["국립과천과학관", "과천과학관"],
  },
  {
    id: "incheon-child-science-fee",
    title: "인천어린이과학관 관람료 안내",
    reason: "어린이과학관 관람료",
    summary: "인천어린이과학관 행사라면 어린이·청소년 관람료와 예약 방식을 함께 확인할 수 있어요.",
    url: "/benefits/cat-8",
    keywords: ["인천어린이과학관"],
  },
  {
    id: "yeosu-marine-weather-science-fee",
    title: "국립여수해양기상과학관 관람료 안내",
    reason: "과학관 관람료",
    summary: "국립여수해양기상과학관 행사라면 어린이·청소년 요금, 단체 할인, 무료 대상 여부를 확인할 수 있어요.",
    url: "/benefits/cat-8",
    keywords: ["국립여수해양기상과학관"],
  },
  {
    id: "gangwon-science-fee",
    title: "국립강원전문과학관 관람료 안내",
    reason: "과학관 관람료",
    summary: "국립강원전문과학관 행사라면 어린이·청소년 관람료와 무료 대상, 교육 프로그램 예약 정보를 확인할 수 있어요.",
    url: "/benefits/cat-8",
    keywords: ["국립강원전문과학관"],
  },
  {
    id: "national-agriculture-museum-free",
    title: "국립농업박물관 무료관람",
    reason: "국립박물관 무료관람",
    summary: "국립농업박물관 행사라면 기본 관람료 무료와 어린이박물관 예약 여부를 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국립농업박물관", "꼬마농부의컬러팜대모험", "수인로154"],
  },
  {
    id: "incheon-maritime-museum-free",
    title: "국립인천해양박물관 무료관람",
    reason: "국립박물관 무료관람",
    summary: "국립인천해양박물관 행사라면 상설전시 무료 관람과 어린이박물관 회차 예약 정보를 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국립인천해양박물관", "월미로294"],
  },
  {
    id: "aviation-library-free",
    title: "국립항공박물관 항공도서관 무료 이용",
    reason: "항공도서관 무료 이용",
    summary: "국립항공박물관 항공도서관 행사라면 자료 열람 시간과 이용 안내를 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국립항공박물관항공도서관", "국립항공박물관", "하늘길177"],
  },
  {
    id: "copyright-museum-free",
    title: "국립저작권박물관 무료관람",
    reason: "국립박물관 무료관람",
    summary: "국립저작권박물관 행사라면 상설전시 무료 관람과 해설·체험 예약 정보를 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국립저작권박물관", "소호로117"],
  },
  {
    id: "nlcy-library-free",
    title: "국립어린이청소년도서관 무료 이용",
    reason: "국립도서관 무료 이용",
    summary: "국립어린이청소년도서관 행사라면 자료실 이용 시간과 이용증 발급 방식을 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국립어린이청소년도서관", "테헤란로7길21"],
  },
  {
    id: "assembly-museum-free",
    title: "국회박물관 무료관람",
    reason: "국회박물관 무료관람",
    summary: "국회박물관 행사라면 무료 관람과 어린이박물관·국회체험관 예약 여부를 확인할 수 있어요.",
    url: "/benefits/cat-9",
    keywords: ["국회박물관", "국회개방행사", "의사당대로1"],
  },
  {
    id: "ntck-green-ticket",
    title: "국립극단 푸른티켓",
    reason: "국립극단 공연 할인",
    summary: "국립극단 공연이면 청년 우대가로 볼 수 있는 푸른티켓 대상 공연인지 확인해보세요.",
    url: "/benefits/cat-3",
    keywords: ["국립극단", "명동예술극장", "백성희장민호극장"],
  },
  {
    id: "ntok-culture-pass",
    title: "국립극장 문화패스",
    reason: "국립극장 할인",
    summary: "국립극장 공연이라면 문화패스 또는 청소년·대학생 할인 권종을 확인할 수 있어요.",
    url: "/benefits/cat-3",
    keywords: ["국립극장해오름극장", "국립극장달오름극장", "국립극장하늘극장", "해오름극장", "달오름극장", "하늘극장"],
  },
  {
    id: "gugak-student-discount",
    title: "국립국악원 청소년·대학생 할인",
    reason: "국립국악원 할인",
    summary: "국립국악원 공연이면 청소년·대학생 할인 적용 여부를 확인해보세요.",
    url: "/benefits/cat-3",
    keywords: ["국립국악원", "국악원", "예악당", "우면당"],
  },
  {
    id: "sac-discount",
    title: "예술의전당 할인",
    reason: "예술의전당 할인",
    summary: "예술의전당 공연·전시라면 싹틔우미, 당일할인티켓 등 적용 가능한 할인 권종을 확인할 수 있어요.",
    url: "/benefits/cat-3",
    keywords: ["서울예술의전당", "한가람미술관", "한가람디자인미술관", "예술의전당오페라극장", "예술의전당콘서트홀"],
  },
  {
    id: "arko-theater-discount",
    title: "아르코·대학로예술극장 회원 할인",
    reason: "아르코 극장 할인",
    summary: "아르코예술극장이나 대학로예술극장 공연이면 회원 할인과 청년 할인 조건을 확인해보세요.",
    url: "/benefits/cat-3",
    keywords: ["아르코예술극장", "아르코 예술극장", "대학로예술극장", "대학로 예술극장"],
  },
  {
    id: "sangsangmadang-culture-day",
    title: "KT&G 상상마당 문화요일 할인",
    reason: "상상마당 할인",
    summary: "KT&G 상상마당 공연·전시·영화라면 문화요일 할인이나 지점별 할인 공지를 확인할 수 있어요.",
    url: "/benefits/cat-3",
    keywords: ["상상마당", "kt&g상상마당", "ktng상상마당"],
  },
  {
    id: "sejong-classic",
    title: "세종문화회관 누구나 클래식",
    reason: "세종문화회관 혜택",
    summary: "세종문화회관 공연이면 누구나 클래식, 행복동행석 등 해당 공연의 지원 좌석을 확인해보세요.",
    url: "/benefits/cat-3",
    keywords: ["세종문화회관", "세종체임버홀", "세종대극장", "세종m씨어터"],
  },
  {
    id: "incheon-ticket",
    title: "인천 천원 문화티켓",
    reason: "인천 공연 혜택",
    summary: "인천문화예술회관 등 인천 공연장 행사라면 천원 문화티켓 대상 여부를 확인할 수 있어요.",
    url: "/benefits/cat-3",
    keywords: ["인천문화예술회관", "인천 문화예술회관", "인천아트센터", "아트센터인천"],
  },
  {
    id: "jeongdong-discount",
    title: "국립정동극장 공연 할인",
    reason: "정동극장 할인",
    summary: "국립정동극장 공연이면 청년·학생 할인이나 문화릴레이티켓 적용 여부를 확인해보세요.",
    url: "/benefits/cat-3",
    keywords: ["국립정동극장", "정동극장"],
  },
  {
    id: "acc-culture-pass",
    title: "국립아시아문화전당 문화패스 할인",
    reason: "ACC 할인",
    summary: "국립아시아문화전당 유료 전시·공연이면 문화패스, 문화누리카드, 예술인패스 할인 여부를 확인할 수 있어요.",
    url: "/benefits/cat-3",
    keywords: ["국립아시아문화전당", "아시아문화전당", "acc"],
  },
];

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const buildHaystack = (festival) =>
  normalize(
    [
      festival?.title,
      festival?.location,
    ].join(" "),
  );

const findMatchedKeyword = (rule, haystack) =>
  rule.keywords.find((keyword) => haystack.includes(normalize(keyword)));

export function getFestivalBenefitMatches(festival) {
  const haystack = buildHaystack(festival);

  return EXACT_BENEFIT_RULES.map((rule) => {
    const matchedKeyword = findMatchedKeyword(rule, haystack);
    if (!matchedKeyword) return null;

    return {
      ...rule,
      matchedKeyword,
      score: normalize(matchedKeyword).length,
    };
  })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
