import { Link, useParams } from "react-router-dom";
import { benefits } from "../data/benefits.js";
import "./Benefits.css";

const DETAIL_INFO = {
  "서울시 청년문화패스": {
    target: "서울 거주 21~23세 청년",
    description:
      "서울시가 청년에게 공연·전시 관람비를 지원하는 지역 문화패스\n정부 청년문화예술패스와 지원 연령이 겹치지 않도록 운영",
    proof: ["본인인증", "거주확인"],
    notes: "모집 기간, 지원 금액, 사용처는 공고별로 달라질 수 있습니다.",
  },
  청년문화예술패스: {
    target: "전국 19~20세 청년",
    description:
      "공연, 전시, 영화 관람에 사용할 수 있는 청년 대상 문화예술 관람비 지원\n협력 예매처와 영화관에서 패스 포인트를 사용할 수 있음",
    proof: ["본인인증", "예매처 계정"],
    notes: "생애 최초 1회 지원이며 선착순 또는 예산 소진 시 마감될 수 있습니다.",
  },
  "지역 청년 문화패스 모아보기": {
    target: "지역별 청년",
    description:
      "인천, 부산, 세종, 청주, 김포, 울산 등 지역별 청년문화예술패스 안내 모음\n거주지, 연령, 지원금, 중복지원 제한을 지역별로 확인 가능",
    proof: ["본인인증", "거주확인"],
    notes: "지역 예산 소진 시 조기 마감될 수 있습니다.",
  },
  "경기 컬처패스": {
    target: "경기도민",
    description:
      "영화, 공연, 전시, 스포츠, 숙박, 액티비티 등에 사용할 수 있는 경기도형 문화소비쿠폰",
    proof: ["경기도민 인증", "전용 앱"],
    notes: "쿠폰 금액과 제휴처는 경기도 안내를 확인하세요.",
  },
  "문화요일·문화가 있는 날 혜택 모아보기": {
    target: "전 국민",
    description:
      "매주 수요일 문화시설 할인 또는 무료개방 정보를 모아보는 혜택\n영화관, 공연장, 미술관, 박물관, 도서관 등 참여 시설별 조건 확인 가능",
    proof: ["시설별 상이"],
    notes: "참여 시설과 혜택은 날짜와 지역에 따라 달라집니다.",
  },
  "문화포털 행사·초대 정보 모아보기": {
    target: "전 국민, 문화포털 회원",
    description:
      "문화초대이벤트, 문화캘린더, 한눈에 보는 문화정보를 모아보는 문화포털 정보\n초대권 응모, 무료 행사, 할인성 문화행사를 찾기 좋음",
    proof: ["문화포털 계정", "행사별 상이"],
    notes: "초대 이벤트는 기간, 발표일, 초대 매수가 이벤트별로 다릅니다.",
  },
  "서울 무료 공연·문화행사 모아보기": {
    target: "전 국민, 서울 청소년",
    description:
      "서울시 공연봄날, 거리공연, 서울광장 공연처럼 무료로 즐길 수 있는 서울 공공 문화행사 모음",
    proof: ["무료관람", "학교 신청", "현장방문"],
    notes: "학교 신청형과 현장 방문형이 섞여 있어 일정 확인이 필요합니다.",
  },
  "서울 문화의 밤 문화로 야금야금": {
    target: "전 국민",
    description:
      "서울 시립 문화시설 금요일 야간개방과 야간 문화 프로그램\n일부 대학로 우수 공연은 1만원 공연 관람권으로 운영",
    proof: ["프로그램별 예약", "현장참여"],
    notes: "시설별 운영일과 예약 방식이 다를 수 있습니다.",
  },
  "대전 마음대로 예술공간·들썩들썩 인 대전": {
    target: "대전 시민, 관람객",
    description:
      "대전 시민 누구나 무료로 이용 가능한 예술공간과 5~10월 거리공연 정보\n전시, 공연, 모임, 북토크, 거리공연을 함께 확인 가능",
    proof: ["무료 대관 신청", "현장 관람"],
    notes: "공간별 대관 일정과 거리공연 장소는 공지에 따라 달라집니다.",
  },
  "광주 전통문화관 토요상설공연": {
    target: "전 국민",
    description:
      "광주 전통문화관에서 4~11월 매주 토요일 운영하는 전통공연 시리즈\n판소리, 산조, 국악창작, 전통연희, 무용 등을 관람 가능",
    proof: ["현장 관람", "일부 체험 예약"],
    notes: "회차별 공연 내용과 체험 운영 여부를 확인하세요.",
  },
  문화릴레이티켓: {
    target: "참여기관 유료 공연 관람자",
    description:
      "참여기관 유료 공연 관람 이력이 있으면 다른 참여 공연을 할인받는 제도\n국립국악원 등 여러 기관에서 20% 내외 할인 운영",
    proof: ["예매내역", "유료티켓"],
    notes: "참여기관, 인정 기간, 캡처 인정 여부가 공연별로 다릅니다.",
  },
  "국립극단 푸른티켓": {
    target: "만 24세 이하",
    description:
      "국립극단 일부 공연을 청년 우대가로 관람할 수 있는 할인 제도",
    proof: ["학생증", "신분증"],
    notes: "공연별 좌석 수량과 적용 조건이 다릅니다.",
  },
  "국립극장 문화패스": {
    target: "만 7~24세",
    description:
      "국립극장 기획공연에서 문화패스 대상자에게 공연별 할인 제공",
    proof: ["신분증"],
    notes: "대관 공연은 적용되지 않을 수 있습니다.",
  },
  "국립국악원 청소년·대학생 할인": {
    target: "청소년, 대학생",
    description:
      "국립국악원 기획공연에서 청소년·대학생 할인 적용\n일부 공연은 30% 내외 할인 운영",
    proof: ["신분증", "학생증"],
    notes: "기획공연 기준이며 대관 공연은 조건이 다를 수 있습니다.",
  },
  "예술의전당 할인 모아보기": {
    target: "만 7~24세, 문화누리카드 소지자, 69세 이상 등",
    description:
      "예술의전당 싹틔우미 회원 할인과 당일할인티켓 정보를 함께 확인\n공연별 할인율과 당일 잔여 좌석 조건이 다름",
    proof: ["신분증", "문화누리카드", "싹틔우미 회원"],
    notes: "회원가입, 당일 공개 시간, 공연별 적용 조건을 확인하세요.",
  },
  "아르코·대학로예술극장 회원 할인": {
    target: "홈페이지 회원, 공연예술인회원",
    description:
      "아르코·대학로예술극장 홈페이지 회원 예매 시 우대 할인 가능\n공연예술인회원은 별도 승인 후 공연별 할인 적용",
    proof: ["회원 로그인", "공연예술인 승인"],
    notes: "할인율과 매수 제한은 공연별로 다릅니다.",
  },
  "KT&G 상상마당 문화요일 할인": {
    target: "상상마당 방문객",
    description:
      "매주 수요일 상상마당 홍대 영화 할인, 홍대·춘천·부산 공연·전시 할인, 논산 캠핑객 프로모션 운영",
    proof: ["수요일 이용", "프로그램별 예매"],
    notes: "지점과 프로그램별 적용 범위가 다릅니다.",
  },
  "인터파크 학생 할인 기획전": {
    target: "대학생, 청소년",
    description:
      "공연별 학생 할인과 증빙 지참 조건을 모아볼 수 있는 예매처 기획 영역",
    proof: ["학생증", "증빙자료"],
    notes: "공연별 좌석과 수량 제한이 큽니다.",
  },
  "국립아시아문화전당 문화패스 할인": {
    target: "만 7~24세, 문화누리카드 이용자 등",
    description:
      "ACC 유료 전시와 일부 공연에서 문화패스, 문화누리카드, 예술인패스 등 할인 운영\n일부 공간은 무료 이용 가능",
    proof: ["신분증", "문화패스", "문화누리카드"],
    notes: "어린이문화원 공연·체험 등 일부 상품은 제외될 수 있습니다.",
  },
  "세종문화회관 누구나 클래식": {
    target: "전 국민, 문화소외계층",
    description:
      "관람객이 1천원, 3천원, 5천원, 1만원 중 원하는 금액을 선택하는 관람료 선택제 클래식 공연",
    proof: ["세종문화회관 회원가입", "추첨 신청"],
    notes: "신청 기간, 당첨자 예매 기간, 잔여석 예매 일정이 공연별로 다릅니다.",
  },
  "인천 천원 문화티켓": {
    target: "인천시민, 문화 소외계층 등",
    description:
      "인천시민이 공연, 영화, 스포츠 등 문화관광 프로그램을 1,000원에 이용할 수 있는 문화복지 사업",
    proof: ["인천시민 확인", "인천e지갑"],
    notes: "프로그램별 예매 일정과 매수 제한이 다릅니다.",
  },
  "국립정동극장 공연 할인": {
    target: "청년·청소년, 예술인패스, 다자녀가족, 보훈·복지 대상자 등",
    description:
      "국립정동극장 공연에서 문화패스, 예술인패스, 문화릴레이티켓, 다자녀, 보훈·복지 할인 등이 공연별 적용",
    proof: ["신분증", "예술인패스", "증빙서류"],
    notes: "할인 권종은 공연별로 달라지며 증빙 미지참 시 차액을 낼 수 있습니다.",
  },
  "궁능 무료 개방": {
    target: "만 24세 이하, 만 65세 이상 등",
    description:
      "경복궁, 창덕궁, 창경궁, 덕수궁, 종묘 등 주요 궁능 무료관람 대상 운영",
    proof: ["신분증"],
    notes: "무료관람 대상과 휴관일은 궁능별로 확인하세요.",
  },
  "서울 공립 박물관·미술관 무료관람": {
    target: "전 국민",
    description:
      "서울시립미술관, 서울공예박물관, 서울역사박물관과 분관을 무료 또는 무료 중심으로 관람",
    proof: ["무료관람", "일부 예약"],
    notes: "특별전과 교육 프로그램은 유료이거나 예약이 필요할 수 있습니다.",
  },
  "시네마테크KOFA 무료 영화 상영": {
    target: "전 국민",
    description:
      "한국영상자료원 시네마테크KOFA에서 고전영화, 예술영화, 기획전 상영작을 무료 관람",
    proof: ["무료예매", "현장발권"],
    notes: "예매는 당일부터 5일 후 상영작까지 가능하고 정시 상영 후 입장이 제한됩니다.",
  },
  "국립중앙박물관 무료관람": {
    target: "전 국민",
    description:
      "국립중앙박물관 상설전시관과 어린이박물관 등 무료 관람 정보를 확인\n유료 특별전시는 별도 관람권이 필요할 수 있음",
    proof: ["무료관람", "일부 예약"],
    notes: "어린이박물관과 학생단체 관람은 예약제가 적용됩니다.",
  },
  "국립현대미술관 무료·할인": {
    target: "만 24세 이하, 대학생, 문화누리카드·예술인패스 소지자 등",
    description:
      "국립현대미술관 서울·과천·덕수궁·청주관 관람료와 무료·할인 대상을 확인\n서울관 기준 만 24세 이하와 대학생은 무료, 예술인패스 소지자는 할인 대상",
    proof: ["신분증", "학생증", "문화누리카드", "예술인패스"],
    notes: "관별·전시별 관람료와 무료 대상이 다를 수 있습니다.",
  },
  "국립민속박물관 무료관람": {
    target: "전 국민",
    description:
      "국립민속박물관 본관, 파주관, 어린이박물관의 무료 관람 정보를 확인\n본관은 경복궁 내부에 있어 경복궁 관람료와 별도로 확인 필요",
    proof: ["무료관람", "어린이박물관 예약"],
    notes: "어린이박물관은 사전 예약 후 관람해야 합니다.",
  },
  "대한민국역사박물관 무료관람": {
    target: "전 국민",
    description:
      "대한민국 근현대사 전시를 무료로 볼 수 있는 국립 박물관 정보",
    proof: ["무료관람"],
    notes: "특별 프로그램은 일정과 예약 여부를 확인하세요.",
  },
  "국립과천과학관 관람료 할인": {
    target: "어린이·청소년, 문화가 있는 날 방문객, 우대 대상자 등",
    description:
      "국립과천과학관 상설전시관 관람료와 어린이·청소년 요금, 무료 대상, 문화가 있는 날 할인 정보를 확인",
    proof: ["신분증", "학생증", "증빙서류"],
    notes: "특별전, 천체투영관, 체험시설은 별도 요금이 있을 수 있습니다.",
  },
  "국립과천과학관 연간회원 혜택": {
    target: "과학관을 자주 방문하는 어린이·청소년·가족",
    description:
      "연간회원 가입 시 상설전시관 무료입장, 천체투영관 50% 할인, 교육비 20% 할인, 5대 과학관 연계 혜택 등을 확인",
    proof: ["연간회원증", "본인 확인"],
    notes: "회원 혜택과 제휴 범위는 과학관 정책에 따라 달라질 수 있습니다.",
  },
  "인천어린이과학관 관람료 안내": {
    target: "어린이·청소년, 가족 관람객",
    description:
      "인천어린이과학관의 어린이·청소년 관람료, 4D 영상관 요금, 사전예약 운영 정보를 확인",
    proof: ["온라인 예약", "연령 확인", "증빙서류"],
    notes: "일반 전시와 4D 영상관은 요금과 예약 방식이 다를 수 있습니다.",
  },
  "국립여수해양기상과학관 관람료 안내": {
    target: "어린이·청소년, 단체 관람객, 우대 대상자",
    description:
      "국립여수해양기상과학관의 어린이·청소년 요금, 단체 할인, 무료·우대 대상 정보를 확인",
    proof: ["신분증", "학생증", "우대 증빙서류"],
    notes: "2025년 3월부터 유료 관람으로 전환되어 방문 전 최신 요금을 확인하세요.",
  },
  "국립강원전문과학관 관람료 안내": {
    target: "어린이·청소년, 가족, 우대 대상자",
    description:
      "국립강원전문과학관의 어린이·청소년 관람료와 무료 대상, 교육 프로그램 예약 정보를 확인",
    proof: ["신분증", "학생증", "우대 증빙서류"],
    notes: "정상 운영 전환 이후 전시 관람료와 교육 프로그램 운영 방식이 달라질 수 있습니다.",
  },
  "국립농업박물관 무료관람": {
    target: "전 국민",
    description:
      "국립농업박물관 상설·기획전시, 어린이박물관, 농업체험장 관람료 무료 정보를 확인",
    proof: ["무료관람", "어린이박물관 예약"],
    notes: "일부 전시와 교육 프로그램은 요금이 발생할 수 있습니다.",
  },
  "국립인천해양박물관 무료관람": {
    target: "전 국민",
    description:
      "국립인천해양박물관 상설전시와 어린이박물관 무료 관람, 회차별 예약 정보를 확인",
    proof: ["무료관람", "온라인 예약"],
    notes: "어린이박물관은 온라인 사전예약 회차제로 운영됩니다.",
  },
  "국립항공박물관 항공도서관 무료 이용": {
    target: "항공·역사 자료를 열람하려는 방문객",
    description:
      "국립항공박물관 항공도서관의 자료 열람 시간과 무료 이용 정보를 확인",
    proof: ["자료 열람", "현장 이용"],
    notes: "도서관 자료는 관내 열람 중심이며 대출은 제한될 수 있습니다.",
  },
  "국립저작권박물관 무료관람": {
    target: "전 국민, 단체 관람객",
    description:
      "국립저작권박물관 상설전시 무료 관람과 전시 해설·교육 체험 예약 정보를 확인",
    proof: ["무료관람", "온라인 예약"],
    notes: "상설전시와 교육·체험 프로그램 예약은 별도로 운영됩니다.",
  },
  "국립어린이청소년도서관 무료 이용": {
    target: "어린이·청소년, 보호자, 연구자",
    description:
      "국립어린이청소년도서관 자료실 이용 시간, 이용증 발급, 관내 열람 정보를 확인",
    proof: ["이용증", "신분 확인"],
    notes: "복사·출력 등 일부 부가 서비스는 유료입니다.",
  },
  "국회박물관 무료관람": {
    target: "전 국민, 어린이박물관 예약 관람객",
    description:
      "국회박물관 상설전시와 어린이박물관 무료 관람, 국회체험관 예약 정보를 확인",
    proof: ["무료관람", "온라인 예약"],
    notes: "어린이박물관과 국회체험관은 사전예약이 필요할 수 있습니다.",
  },
  문화누리카드: {
    target: "기초생활수급자, 차상위계층",
    description:
      "문화예술, 국내여행, 체육활동에 사용할 수 있는 통합문화이용권",
    proof: ["수급자격", "카드 발급"],
    notes: "연도별 지원금과 사용 기간을 확인하세요.",
  },
  "문화비 소득공제": {
    target: "근로소득자",
    description:
      "도서, 공연, 영화, 박물관, 미술관 등 문화비 지출에 대한 연말정산 소득공제",
    proof: ["결제 내역", "소득공제 사업자"],
    notes: "등록된 사업자 결제분만 공제 대상입니다.",
  },
  "K-아트 청년 창작자 지원": {
    target: "만 39세 이하 기초예술 분야 청년 창작자",
    description:
      "문학, 시각, 공연, 다원예술 분야 청년 창작자에게 창작지원금을 지원하는 정부 사업",
    proof: ["창작자 자격", "신청서류"],
    notes: "모집 기간과 자격은 공고를 확인하세요.",
  },
  "예술인패스 문화시설 할인": {
    target: "예술활동증명 완료 예술인 등",
    description:
      "예술인패스 소지자가 전국 문화예술기관과 제휴 문화공간에서 공연·전시 요금 할인 혜택을 받는 제도",
    proof: ["예술인패스", "예술활동증명"],
    notes: "제휴처와 할인율은 기관별로 다릅니다.",
  },
  "국내여행 할인 모아보기": {
    target: "국내여행 이용자",
    description:
      "숙박세일 페스타, 디지털 관광주민증, 여행가는 달 등 국내여행 할인 정보를 함께 확인",
    proof: ["쿠폰", "QR 인증"],
    notes: "혜택별 기간, 사용 지역, 발급 수량이 다릅니다.",
  },
  "근로자 휴가지원사업": {
    target: "참여 기업 근로자",
    description:
      "근로자, 기업, 정부가 함께 국내여행 경비를 적립해 휴가비를 지원하는 사업",
    proof: ["기업 단위 신청", "근로자 참여"],
    notes: "기업 단위로 신청하며 선착순 모집으로 운영됩니다.",
  },
};

function splitDetailLabel(label) {
  const separator = " - ";
  const index = label.indexOf(separator);

  if (index === -1) {
    return { title: label, action: "상세 보기" };
  }

  return {
    title: label.slice(0, index),
    action: label.slice(index + separator.length),
  };
}

function groupDetailLinks(detailLinks) {
  const grouped = new Map();

  detailLinks.forEach((item) => {
    const { title, action } = splitDetailLabel(item.label);

    if (!grouped.has(title)) {
      grouped.set(title, {
        title,
        links: [],
        ...(DETAIL_INFO[title] ?? {
          target: "혜택별 대상 상이",
          description: "상세 링크에서 대상, 기간, 사용 조건을 확인할 수 있는 혜택입니다.",
          proof: ["혜택별 상이"],
          notes: "운영 기간과 적용 조건은 링크별로 확인하세요.",
        }),
      });
    }

    const group = grouped.get(title);
    const isDuplicate = group.links.some(
      (link) => link.url === item.url && link.label === action,
    );

    if (!isDuplicate) {
      group.links.push({
        label: action,
        url: item.url,
      });
    }
  });

  return Array.from(grouped.values());
}

export default function BenefitCategoryDetail() {
  const { categoryId } = useParams();
  const category = benefits.find((benefit) => benefit.id === categoryId);

  if (!category) {
    return (
      <div className="benefits-page">
        <div className="benefits-container">
          <Link className="benefits-back-link" to="/benefits">
            ← 혜택 모아보기로 돌아가기
          </Link>
          <div className="benefits-empty">혜택 카테고리를 찾을 수 없어요.</div>
        </div>
      </div>
    );
  }

  const detailCards = groupDetailLinks(category.detailLinks ?? []);

  return (
    <div className="benefits-page">
      <div className="benefits-container">
        <Link className="benefits-back-link" to="/benefits">
          ← 혜택 모아보기로 돌아가기
        </Link>

        <div className="benefits-detail-head">
          <p className="benefits-detail-kicker">{category.category}</p>
          <h2>{category.name}</h2>
          <p>{category.description}</p>
        </div>

        <div className="benefits-count">
          총 <span>{detailCards.length}개</span>의 상세 혜택이 있어요
        </div>

        <div className="benefits-list">
          {detailCards.map((card) => (
            <article className="benefit-detail-card" key={card.title}>
              <div className="benefit-detail-card-top">
                <h3>{card.title}</h3>
              </div>
              <p className="benefit-detail-target">{card.target}</p>
              <p className="benefit-detail-desc">
                {card.description.split("\n").map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </p>
              <div className="benefit-detail-proof">
                {card.proof.map((proof) => (
                  <span key={proof}>{proof}</span>
                ))}
              </div>
              {card.notes && <p className="benefit-detail-note">※ {card.notes}</p>}
              <div className="benefit-detail-actions">
                {card.links.map((link) => (
                  <a
                    href={link.url}
                    key={`${card.title}-${link.label}-${link.url}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
