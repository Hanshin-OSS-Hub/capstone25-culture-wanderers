-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: culture_wanderers
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `benefits`
--

DROP TABLE IF EXISTS `benefits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `benefits` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_audience` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '대상 (예: 만 19~24세)',
  `description` text COLLATE utf8mb4_unicode_ci,
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_url` text COLLATE utf8mb4_unicode_ci,
  `image_url` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `benefits`
--

LOCK TABLES `benefits` WRITE;
/*!40000 ALTER TABLE `benefits` DISABLE KEYS */;
INSERT INTO `benefits` VALUES (1,'서울시 청년문화패스','만 19~24세 서울시민',NULL,'서울',NULL,NULL),(2,'국립중앙박물관 대학생 무료입장','재학생(학생증 지참)',NULL,'전국',NULL,NULL);
/*!40000 ALTER TABLE `benefits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL,
  `user_id` int NOT NULL,
  `content` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `festivals`
--

DROP TABLE IF EXISTS `festivals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `festivals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `end_date` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail_url` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` text COLLATE utf8mb4_unicode_ci,
  `tel` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `festivals`
--

LOCK TABLES `festivals` WRITE;
/*!40000 ALTER TABLE `festivals` DISABLE KEYS */;
INSERT INTO `festivals` VALUES (1,'광복로 겨울빛 트리축제','부산광역시','부산광역시 중구 광복로 72-1 (광복동2가)','20251205','20260222','http://tong.visitkorea.or.kr/cms/resource/05/3576405_image2_1.JPG','축제','무료','051-714-4758','상세 정보 준비 중','2026-01-27 15:36:34'),(2,'2026 해양레저관광 박람회','인천광역시','인천광역시 연수구 센트럴로 123 (송도동)','20260401','20260404','https://tong.visitkorea.or.kr/cms/resource/58/4002358_image2_1.jpg','축제','무료','02-785-5801','상세 정보 준비 중','2026-01-27 15:36:35'),(3,'퓨처그라운드 (FUTUREGROUND)','서울특별시','서울특별시 강서구 하늘길 지하77 (방화동)','20250530','20260228','http://tong.visitkorea.or.kr/cms/resource/55/3529255_image2_1.jpg','축제','- 현장 예매 20,000원<br>- 온라인 예매 18,000원<br>※ 무료<br>- 48개월 미만 유아<br>※기타 상세 내용은 유선 문의','070-8810-2420','상세 정보 준비 중','2026-01-27 15:36:36'),(4,'온천천 빛 축제','부산광역시','부산광역시 동래구 중앙대로 1324 (온천동)','20251219','20260201','http://tong.visitkorea.or.kr/cms/resource/72/3574272_image2_1.jpg','축제','무료 (푸드트럭 제외)','051-550-6642','상세 정보 준비 중','2026-01-27 15:36:37'),(5,'2026 숭례문 파수의식','서울특별시','서울특별시 중구 세종대로 40 (남대문로4가)','20260101','20261231','https://tong.visitkorea.or.kr/cms/resource/99/4001599_image2_1.jpg','축제','무료','02-3789-7402','상세 정보 준비 중','2026-01-27 15:36:38'),(6,'영양꽁꽁겨울축제','경상북도','경상북도 영양군 영양읍 현리','20260109','20260201','https://tong.visitkorea.or.kr/cms/resource/33/3588433_image2_1.jpg','축제','유료','054-680-6450~6453','상세 정보 준비 중','2026-01-27 15:36:39'),(7,'2026 인터내셔널 키스포츠페스티벌 대구','대구광역시','대구광역시 북구 엑스코로 10 (산격동)','20260411','20260412','http://tong.visitkorea.or.kr/cms/resource/88/3579088_image2_1.png','축제','1일권 50,000원 / 2일권 90,000원','1811-6420','상세 정보 준비 중','2026-01-27 15:36:40'),(8,'제24회 성우하이텍배 KNN 환경마라톤','부산광역시','부산광역시 해운대구 APEC로 55 (우동)','20260322','20260322','http://tong.visitkorea.or.kr/cms/resource/29/3590329_image2_1.png','축제','- 10㎞ 45,000원<br>- 건강 달리기(5㎞) 35,000원','1522-4897','상세 정보 준비 중','2026-01-27 15:36:41'),(9,'남산봉수의식 등 전통문화행사','서울특별시','서울특별시 종로구 종로 54 (관철동)','20260101','20261231','https://tong.visitkorea.or.kr/cms/resource/57/4001657_image2_1.jpg','축제','무료','행사장 02-319-1220운영사 02-737-6444','상세 정보 준비 중','2026-01-27 15:36:42'),(10,'포천백운계곡 동장군축제','경기도','경기도 포천시 포화로 236-11','20251220','20260222','http://tong.visitkorea.or.kr/cms/resource/21/3580521_image2_1.jpg','축제','입장료 유료 3,000원 (2,000원 식음료권 제공)','031-536-9917','상세 정보 준비 중','2026-01-27 15:36:43'),(11,'광안리 M(Marvelous) 드론 라이트쇼','부산광역시','부산광역시 수영구 광안해변로 219 (광안동)','20260101','20261231','http://tong.visitkorea.or.kr/cms/resource/12/3518612_image2_1.jpeg','축제','무료','051-610-6518','상세 정보 준비 중','2026-01-27 15:36:44'),(12,'고령 대가야축제','경상북도','경상북도 고령군 대가야로 1216 대가야역사테마관광지','20260327','20260329','https://tong.visitkorea.or.kr/cms/resource/25/3476725_image2_1.jpg','축제','무료(일부 체험 프로그램 유료)','054-955-0808','상세 정보 준비 중','2026-01-27 15:36:45'),(13,'2026 코리아그랜드세일','서울특별시','서울특별시 중구 명동길 14 (명동2가)','20260101','20260222','https://tong.visitkorea.or.kr/cms/resource/27/4001627_image2_1.jpg','축제','무료','070-8789-5600','상세 정보 준비 중','2026-01-27 15:36:46'),(14,'2026 광주 ACE Fair','광주광역시','광주광역시 서구 상무누리로 30','20260910','20260913','https://tong.visitkorea.or.kr/cms/resource/46/4001646_image2_1.jpg','축제','온라인 사전 등록시 무료※ 자세한 사항은 홈페이지 참고','062-611-2242','상세 정보 준비 중','2026-01-27 15:36:47'),(15,'2026 부산국제보트쇼','부산광역시','부산광역시 해운대구 APEC로 55 (우동)','20260417','20260419','http://tong.visitkorea.or.kr/cms/resource/47/3490847_image2_1.jpg','축제','유료<br>- 성인 8,000원<br>- 소인 4,000원','051-740-8600','상세 정보 준비 중','2026-01-27 15:36:48'),(16,'평창송어축제','강원특별자치도','강원특별자치도 평창군 진부면 경강로 3562','20260109','20260209','https://tong.visitkorea.or.kr/cms/resource/81/4002581_image2_1.jpg','축제','유료','033-336-4000','상세 정보 준비 중','2026-01-27 15:36:49'),(17,'태백산 눈축제','강원특별자치도','강원특별자치도 태백시 소도동','20260131','20260208','https://tong.visitkorea.or.kr/cms/resource/00/4001400_image2_1.jpg','축제','무료','033-553-6900','상세 정보 준비 중','2026-01-27 15:36:50'),(18,'안성 동막골 빙어축제','경기도','경기도 안성시 죽산면 곰내미길 48','20260117','20260217','https://tong.visitkorea.or.kr/cms/resource/01/3590201_image2_1.jpg','축제','유료아동 4세~13세 5,000원성인 14세 이상 10,000원','031-674-4528','상세 정보 준비 중','2026-01-27 15:36:51'),(19,'양평빙송어축제','경기도','경기도 양평군 곱다니길 55-2','20251206','20260302','http://tong.visitkorea.or.kr/cms/resource/93/3108393_image2_1.jpg','축제','유료<br>돔송어 패키지: 10000원<br>돔빙어 패키지: 10000원<br>돔빙송어 패키지: 17000원','031-775-5205','상세 정보 준비 중','2026-01-27 15:36:53'),(20,'영주 한국선비문화축제','경상북도','경상북도 영주시 순흥면 선비세상로 1','20260502','20260505','https://tong.visitkorea.or.kr/cms/resource/40/4001440_image2_1.jpg','축제','무료','054-630-8703','상세 정보 준비 중','2026-01-27 15:36:54'),(21,'영동곶감축제','충청북도','충청북도 영동군 영동읍 계산리','20260130','20260201','http://tong.visitkorea.or.kr/cms/resource/18/3586818_image2_1.jpg','축제','무료 (단, 일부체험 프로그램은 유료 진행)','043-745-8922','상세 정보 준비 중','2026-01-27 15:36:55'),(22,'고창모양성제','전북특별자치도','전북특별자치도 고창군 고창읍 모양성로 11','20261015','20261019','https://tong.visitkorea.or.kr/cms/resource/30/3519730_image2_1.jpg','축제','무료','063-560-2949','상세 정보 준비 중','2026-01-27 15:36:56'),(23,'이천도자기축제','경기도','경기도 이천시 신둔면 도자예술로5번길 109','20260424','20260505','https://tong.visitkorea.or.kr/cms/resource/09/4004509_image2_1.jpg','축제','무료','031-645-3683','상세 정보 준비 중','2026-01-27 15:36:57'),(24,'얼음나라화천 산천어축제','강원특별자치도','강원특별자치도 화천군 화천읍 산천어길 137','20260110','20260201','https://tong.visitkorea.or.kr/cms/resource/00/3064900_image2_1.png','축제','유료 (자세한 사항은 홈페이지 참조.)','1688-3005','상세 정보 준비 중','2026-01-27 15:36:58'),(25,'홍성남당항 새조개축제','충청남도','충청남도 홍성군 서부면 남당항로213번길 1-1','20260117','20260430','https://tong.visitkorea.or.kr/cms/resource/69/3469769_image2_1.JPG','축제','무료 (식당 이용료 별도)','010-5433-8196','상세 정보 준비 중','2026-01-27 15:36:59'),(26,'대관령눈꽃축제','강원특별자치도','강원특별자치도 평창군 대관령로 135-9','20260213','20260222','https://tong.visitkorea.or.kr/cms/resource/89/3588789_image2_1.JPG','축제','유료 (가격 홈페이지 참조)','033-335-3995','상세 정보 준비 중','2026-01-27 15:37:00'),(27,'사천에어쇼','경상남도','경상남도 사천시 사천읍 정의리','20261022','20261025','http://tong.visitkorea.or.kr/cms/resource/49/3566649_image2_1.png','축제','무료','055-831-2061','상세 정보 준비 중','2026-01-27 15:37:01'),(28,'서울 왕궁수문장 교대의식','서울특별시','서울특별시 중구 세종대로 99 (정동)','20260101','20261231','https://tong.visitkorea.or.kr/cms/resource/23/4003323_image2_1.jpg','축제','무료','02-6242-7402','상세 정보 준비 중','2026-01-27 15:37:02'),(29,'단종문화제','강원특별자치도','강원특별자치도 영월군 영월읍 하송리','20260424','20260426','https://tong.visitkorea.or.kr/cms/resource/21/4004221_image2_1.jpg','축제','무료','033-375-6372','상세 정보 준비 중','2026-01-27 15:37:05'),(30,'고흥갑재민속전시관','전라남도','전라남도 고흥군 두원면 두원운석길 9',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/06/3581306_image2_1.jpg','전시','[성인] 2,000원<br>[청소년·군인] 1,500원<br>[어린이] 1,000원','061-830-5990','상세 정보 준비 중','2026-01-27 15:37:08'),(31,'북한인권전시실','서울특별시','서울특별시 종로구 삼일대로 393 (관철동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/78/3562378_image2_1.jpg','전시','무료<br>※ 단체 방문은 걔별 문의 요망','02-723-6045','상세 정보 준비 중','2026-01-27 15:37:09'),(32,'법천사지 유적전시관','강원특별자치도','강원특별자치도 원주시 부론면 법천사지길 50-15',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/66/3540166_image2_1.jpg','전시','무료','033-737-2808','상세 정보 준비 중','2026-01-27 15:37:10'),(33,'임당유적전시관','경상북도','경상북도 경산시 청운2로 29 (임당동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/22/3507922_image2_1.jpg','전시','무료','053-804-7337','상세 정보 준비 중','2026-01-27 15:37:11'),(34,'화랑대역사 전시관','서울특별시','서울특별시 노원구 화랑로 610 (공릉동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/62/3456862_image2_1.jpg','전시','무료','070-4179-3777','상세 정보 준비 중','2026-01-27 15:37:12'),(35,'성주 성산동 고분군 전시관','경상북도','경상북도 성주군 성주읍 성산4길 37',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/33/3444733_image2_1.JPG','전시','무료<br>※ 단, 자체기획전시 및 대관전시, 체험프로그램은 별도(홈페이지 참조)','054-930-8384','상세 정보 준비 중','2026-01-27 15:37:13'),(36,'진주남강유등전시관','경상남도','경상남도 진주시 망경로 207 (망경동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/90/3488690_image2_1.jpg','전시','[개인]<br>- 어른 2,000원<br>- 청소년·군인 1,000원<br>- 어린이 500원<br>[단체(20인 이상)]<br>- 어른 1,500원<br>- 청소년·군인 800원<br>- 어린이 400원<br>※무료<br>- 6세 이하 /  65세 이상 / 장애인(장애인 수첩 소지자)에 한함','055-762-8583','상세 정보 준비 중','2026-01-27 15:37:14'),(37,'장수역사전시관','전북특별자치도','전북특별자치도 장수군 장계면 방천길 11',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/05/3338105_image2_1.jpg','전시','무료','063-350-1745','상세 정보 준비 중','2026-01-27 15:37:15'),(38,'봉화 농경문화전시관','경상북도','경상북도 봉화군 명호면 광석길 39',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/85/3088985_image2_1.JPG','전시','무료','봉화군청 박물관팀 054-679-6671','상세 정보 준비 중','2026-01-27 15:37:16'),(39,'태안 농업 전시 체험관','충청남도','충청남도 태안군 태안읍 송암로 523',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/42/3057142_image2_1.jpg','전시','무료','041-670-5033','상세 정보 준비 중','2026-01-27 15:37:17'),(40,'황금박쥐특별전시관','전라남도','전라남도 함평군 함평읍 곤재로 36-13',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/32/3081732_image2_1.jpg','전시','무료','061-320-2203','상세 정보 준비 중','2026-01-27 15:37:18'),(41,'한양도성유적전시관','서울특별시','서울특별시 중구 소월로 99 (회현동1가)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/14/3458814_image2_1.jpg','전시','무료','02-779-9870','상세 정보 준비 중','2026-01-27 15:37:19'),(42,'궁산 땅굴 역사전시관','서울특별시','서울특별시 강서구 양천로49길 106 (마곡동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/39/3045139_image2_1.jpg','전시','무료','02-2600-6081','상세 정보 준비 중','2026-01-27 15:37:20'),(43,'대전시립연정국악원','대전광역시','대전광역시 서구 둔산대로 181 (만년동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/70/3038770_image2_1.JPG','전시','공연 별로 상이함','042-270-8500','상세 정보 준비 중','2026-01-27 15:37:21'),(44,'영도해녀문화전시관','부산광역시','부산광역시 영도구 중리남로 2-36 (동삼동)',NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/16/3592316_image2_1.jpg','전시','무료','051-419-4505','상세 정보 준비 중','2026-01-27 15:37:22'),(45,'망양로 산복도로 전시관','부산광역시','부산광역시 동구 망양로 488 (초량동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/46/3017046_image2_1.JPG','전시','무료','051-462-1020','상세 정보 준비 중','2026-01-27 15:37:23'),(46,'구례군 농업기술센터 식물표본전시관','전라남도','전라남도 구례군 구례읍 동산1길 29',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/23/3014523_image2_1.jpg','전시','무료','061-780-2095','상세 정보 준비 중','2026-01-27 15:37:24'),(47,'여수민속전시관','전라남도','전라남도 여수시 서부로 1442 율촌중앙초등학교',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/99/3010499_image2_1.jpg','전시','무료 (체험 시 체험료 별도 부과)','061-683-2231','상세 정보 준비 중','2026-01-27 15:37:26'),(48,'안동포전시관','경상북도','경상북도 안동시 금소길 341-12',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/21/3032921_image2_1.JPG','전시','무료','054-823-4585','상세 정보 준비 중','2026-01-27 15:37:27'),(49,'송대말 등대 빛 체험전시관','경상북도','경상북도 경주시 감포로 226-19',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/62/3006762_image2_1.jpg','전시','무료','054-773-8755','상세 정보 준비 중','2026-01-27 15:37:28'),(50,'정조테마공연장','경기도','경기도 수원시 팔달구 정조로 817 (팔달로1가)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/72/3304072_image2_1.jpg','공연','정보 없음','031-290-3573','상세 정보 준비 중','2026-01-27 15:37:29'),(51,'광주광역시공연마루','광주광역시','광주광역시 서구 상무시민로 3 (치평동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/94/3029594_image2_1.jpg','공연','무료','062-613-8337','상세 정보 준비 중','2026-01-27 15:37:30'),(52,'진해야외공연장','경상남도','경상남도 창원시 진해구 천자로 103 (덕산동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/88/3070488_image2_1.JPG','공연','공연 별로 상이함','055-719-7800','상세 정보 준비 중','2026-01-27 15:37:31'),(53,'북한강야외공연장','경기도','경기도 남양주시 화도읍 금남리',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/39/3013939_image2_1.JPG','공연','정보 없음','공연축제팀 031-590-7325','상세 정보 준비 중','2026-01-27 15:37:32'),(54,'동덕여자대학교 공연예술센터','서울특별시','서울특별시 종로구 동숭길 126 (동숭동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/89/3025289_image2_1.jpg','공연','공연 별로 상이함','02-940-4578','상세 정보 준비 중','2026-01-27 15:37:33'),(55,'국립극장 공연예술박물관','서울특별시','서울특별시 중구 장충단로 59 (장충동2가)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/11/3012811_image2_1.jpg','공연','무료','02-2280-4114','상세 정보 준비 중','2026-01-27 15:37:34'),(56,'양주소놀이굿공연장','경기도','경기도 양주시 백석읍 중앙로93번길 70-21',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/07/2797807_image2_1.jpg','공연','무료 (체험 진행 시 별도 부과)','031-879-5969','상세 정보 준비 중','2026-01-27 15:37:35'),(57,'북구문화예술회관 공연장','부산광역시','부산광역시 북구 금곡대로46번길 50',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/87/3343387_image2_1.jpg','공연','※ 공연별 상이하므로 홈페이지 참고','051-309-4085','상세 정보 준비 중','2026-01-27 15:37:36'),(58,'남해국제탈공연박물관','경상남도','경상남도 남해군 이동면 남해대로 2412',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/54/3553754_image2_1.jpg','공연','[개인]<br>- 어른 2,000원<br>- 청소년, 군인 1,500원<br>- 어린이 1,000원br>[단체(20인 이상)]<br>- 어른 1,500원<br>- 청소년, 군인 1,000원<br>- 어린이 500원','남해군청 문화체육과 055-860-3790','상세 정보 준비 중','2026-01-27 15:37:37'),(59,'성산포 해녀물질공연장','제주특별자치도','제주특별자치도 서귀포시 성산읍 일출로 284-34',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/46/3024646_image2_1.jpg','공연','무료','성산포 해녀물질공연장 064-783-0959<br>\n해녀의 집 064-783-1135','상세 정보 준비 중','2026-01-27 15:37:38'),(60,'성남시 야외공연장','경기도','경기도 성남시 분당구 성남대로 550 (수내동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/16/3053716_image2_1.jpg','공연','정보 없음','031-711-7762','상세 정보 준비 중','2026-01-27 15:37:39'),(61,'한전아트센터 공연장','서울특별시','서울특별시 서초구 효령로72길 60 (서초동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/99/3109799_image2_1.JPG','공연','공연 별로 상이함','02-2105-8133','상세 정보 준비 중','2026-01-27 15:37:40'),(62,'위니아트(건국대학교 새천년관 대공연장)','서울특별시','서울특별시 광진구 능동로 120 (화양동)',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/92/3539992_image2_1.jpg','공연','공연 및 전시 별로 상이함','02-455-1896~7','상세 정보 준비 중','2026-01-27 15:37:41'),(63,'제주 탑동해변공연장','제주특별자치도','제주특별자치도 제주시 중앙로 2',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/44/3411244_image2_1.jpg','공연','정보 없음','064-728-3453','상세 정보 준비 중','2026-01-27 15:37:42'),(64,'안성 남사당 공연장','경기도','경기도 안성시 보개면 남사당로 198-2',NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/81/1781881_image2_1.jpg','공연','- 성인 12,000원<br>- 청소년 6,000원<br>-어린이 3.000원','031-678-2518','상세 정보 준비 중','2026-01-27 15:37:43'),(65,'아르코공연연습센터 포항','경상북도','경상북도 포항시 북구 중앙로 373 (덕수동)',NULL,NULL,NULL,'공연','대연습실 - 오전, 오후, 저녁 20,000원 / 일일 40,000원 <br>중연습실 - 오전, 오후, 저녁 10,000원 / 일일 20,000원 <br>소연습실 - 오전, 오후, 저녁 5,000원 / 일일 10,000원 <br>리딩룸, 세미나실 무료 <br>(단, 연습실 대관자에 한함)','054-289-7932','상세 정보 준비 중','2026-01-27 15:37:44');
/*!40000 ALTER TABLE `festivals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `party_members`
--

DROP TABLE IF EXISTS `party_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `party_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `party_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('APPLIED','ACCEPTED') COLLATE utf8mb4_unicode_ci DEFAULT 'ACCEPTED',
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `party_id` (`party_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `party_members_ibfk_1` FOREIGN KEY (`party_id`) REFERENCES `parties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `party_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `party_members`
--

LOCK TABLES `party_members` WRITE;
/*!40000 ALTER TABLE `party_members` DISABLE KEYS */;
INSERT INTO `party_members` VALUES (1,1,1,'ACCEPTED','2026-01-23 03:10:28'),(2,1,2,'ACCEPTED','2026-01-23 03:10:28');
/*!40000 ALTER TABLE `party_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` enum('QUESTION','REVIEW') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '질문/리뷰 구분',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `view_count` int DEFAULT '0',
  `rating` int DEFAULT NULL COMMENT '별점 (리뷰일 때만 사용)',
  `region_tag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '지역 태그',
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (1,1,'QUESTION','축제 갈 때 옷차림 질문','많이 춥나요?',0,NULL,'서울',NULL,'2026-01-23 03:10:28'),(2,2,'REVIEW','위키드 보고 왔습니다 (스포X)','진짜 인생 뮤지컬...',0,5,'서울',NULL,'2026-01-23 03:10:28');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-02 18:35:54
