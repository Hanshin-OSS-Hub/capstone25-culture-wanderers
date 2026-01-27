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
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '행사명',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '카테고리 (전시/공연/축제)',
  `region` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '지역 (서울, 경기 등)',
  `location` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '상세 주소 (여의도공원로 등)',
  `start_date` date DEFAULT NULL COMMENT '시작일',
  `end_date` date DEFAULT NULL COMMENT '종료일',
  `operating_hours` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '운영 시간 (예: 09:00~21:00)',
  `operating_description` text COLLATE utf8mb4_unicode_ci COMMENT '운영 안내 상세 (주간/야간/휴무 등)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '행사 소개 (긴 본문)',
  `guidelines` text COLLATE utf8mb4_unicode_ci COMMENT '유의사항 (반려동물, 텐트 규정 등)',
  `price` int DEFAULT '0' COMMENT '일반 가격',
  `student_price` int DEFAULT '0' COMMENT '학생 할인가',
  `is_student_discount` tinyint(1) DEFAULT '0' COMMENT '학생 할인 뱃지 표시용',
  `booking_url` text COLLATE utf8mb4_unicode_ci COMMENT '예매하기 버튼 링크',
  `host_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '주최 (예: 서울특별시)',
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '문의 전화',
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '문의 이메일',
  `thumbnail_url` text COLLATE utf8mb4_unicode_ci COMMENT '썸네일 이미지',
  `avg_rating` decimal(3,1) DEFAULT '0.0' COMMENT '평점',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `festivals`
--

LOCK TABLES `festivals` WRITE;
/*!40000 ALTER TABLE `festivals` DISABLE KEYS */;
INSERT INTO `festivals` VALUES (1,'무안 겨울 숭어축제','축제','전라남도','전라남도 무안군 해제면 해제중앙로 13','2026-01-24','2026-01-25',NULL,NULL,'무안 겨울 숭어축제에 오신 것을 환영합니다! (문의: 061-450-5472)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/00/4001500_image2_1.png',0.0,'2026-01-23 04:44:01'),(2,'단양 겨울놀이 축제','축제','충북','충북 단양군 대강면 두음리 564-7','2026-01-23','2026-01-26',NULL,NULL,'단양 겨울놀이 축제에 오신 것을 환영합니다! (문의: 043-421-7883)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/15/4001315_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(3,'광복로 겨울빛 트리축제','축제','부산광역시','부산광역시 중구 광복로 72-1 (광복동2가)','2025-12-05','2026-02-22',NULL,NULL,'광복로 겨울빛 트리축제에 오신 것을 환영합니다! (문의: 051-714-4758)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/05/3576405_image2_1.JPG',0.0,'2026-01-23 04:44:01'),(4,'2026 해양레저관광 박람회','축제','인천광역시','인천광역시 연수구 센트럴로 123 (송도동)','2026-04-01','2026-04-04',NULL,NULL,'2026 해양레저관광 박람회에 오신 것을 환영합니다! (문의: 02-785-5801)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/58/4002358_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(5,'퓨처그라운드 (FUTUREGROUND)','축제','서울특별시','서울특별시 강서구 하늘길 지하77 (방화동)','2025-05-30','2026-02-28',NULL,NULL,'퓨처그라운드 (FUTUREGROUND)에 오신 것을 환영합니다! (문의: 070-8810-2420)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/55/3529255_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(6,'온천천 빛 축제','축제','부산광역시','부산광역시 동래구 중앙대로 1324 (온천동)','2025-12-19','2026-02-01',NULL,NULL,'온천천 빛 축제에 오신 것을 환영합니다! (문의: 051-550-6642)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/72/3574272_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(7,'2026 숭례문 파수의식','축제','서울특별시','서울특별시 중구 세종대로 40 (남대문로4가)','2026-01-01','2026-12-31',NULL,NULL,'2026 숭례문 파수의식에 오신 것을 환영합니다! (문의: 02-3789-7402)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/99/4001599_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(8,'영양꽁꽁겨울축제','축제','경상북도','경상북도 영양군 영양읍 현리','2026-01-09','2026-02-01',NULL,NULL,'영양꽁꽁겨울축제에 오신 것을 환영합니다! (문의: 054-680-6450~6453)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/33/3588433_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(9,'2026 인터내셔널 키스포츠페스티벌 대구','축제','대구광역시','대구광역시 북구 엑스코로 10 (산격동)','2026-04-11','2026-04-12',NULL,NULL,'2026 인터내셔널 키스포츠페스티벌 대구에 오신 것을 환영합니다! (문의: 1811-6420)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/88/3579088_image2_1.png',0.0,'2026-01-23 04:44:01'),(10,'제24회 성우하이텍배 KNN 환경마라톤','축제','부산광역시','부산광역시 해운대구 APEC로 55 (우동)','2026-03-22','2026-03-22',NULL,NULL,'제24회 성우하이텍배 KNN 환경마라톤에 오신 것을 환영합니다! (문의: 1522-4897)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/29/3590329_image2_1.png',0.0,'2026-01-23 04:44:01'),(11,'남산봉수의식 등 전통문화행사','축제','서울특별시','서울특별시 종로구 종로 54 (관철동)','2026-01-01','2026-12-31',NULL,NULL,'남산봉수의식 등 전통문화행사에 오신 것을 환영합니다! (문의: 행사장 02-319-1220운영사 02-737-6444)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/57/4001657_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(12,'포천백운계곡 동장군축제','축제','경기도','경기도 포천시 포화로 236-11','2025-12-20','2026-02-22',NULL,NULL,'포천백운계곡 동장군축제에 오신 것을 환영합니다! (문의: 031-536-9917)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/21/3580521_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(13,'광안리 M(Marvelous) 드론 라이트쇼','축제','부산광역시','부산광역시 수영구 광안해변로 219 (광안동)','2026-01-01','2026-12-31',NULL,NULL,'광안리 M(Marvelous) 드론 라이트쇼에 오신 것을 환영합니다! (문의: 051-610-6518)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/12/3518612_image2_1.jpeg',0.0,'2026-01-23 04:44:01'),(14,'고령 대가야축제','축제','경상북도','경상북도 고령군 대가야로 1216 대가야역사테마관광지','2026-03-27','2026-03-29',NULL,NULL,'고령 대가야축제에 오신 것을 환영합니다! (문의: 054-955-0808)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/25/3476725_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(15,'2026 코리아그랜드세일','축제','서울특별시','서울특별시 중구 명동길 14 (명동2가)','2026-01-01','2026-02-22',NULL,NULL,'2026 코리아그랜드세일에 오신 것을 환영합니다! (문의: 070-8789-5600)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/27/4001627_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(16,'2026 광주 ACE Fair','축제','광주광역시','광주광역시 서구 상무누리로 30','2026-09-10','2026-09-13',NULL,NULL,'2026 광주 ACE Fair에 오신 것을 환영합니다! (문의: 062-611-2242)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/46/4001646_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(17,'2026 부산국제보트쇼','축제','부산광역시','부산광역시 해운대구 APEC로 55 (우동)','2026-04-17','2026-04-19',NULL,NULL,'2026 부산국제보트쇼에 오신 것을 환영합니다! (문의: 051-740-8600)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/47/3490847_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(18,'함안곶감축제','축제','경상남도','경상남도 함안군 함안대로 619-4 함안스포츠타운','2026-01-23','2026-01-25',NULL,NULL,'함안곶감축제에 오신 것을 환영합니다! (문의: 055-580-4554)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/72/4001272_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(19,'평창송어축제','축제','강원특별자치도','강원특별자치도 평창군 진부면 경강로 3562','2026-01-09','2026-02-09',NULL,NULL,'평창송어축제에 오신 것을 환영합니다! (문의: 033-336-4000)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/81/4002581_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(20,'태백산 눈축제','축제','강원특별자치도','강원특별자치도 태백시 소도동','2026-01-31','2026-02-08',NULL,NULL,'태백산 눈축제에 오신 것을 환영합니다! (문의: 033-553-6900)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/00/4001400_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(21,'홍천강 꽁꽁축제','축제','강원특별자치도','강원특별자치도 홍천군 홍천읍 갈마곡리','2026-01-09','2026-01-25',NULL,NULL,'홍천강 꽁꽁축제에 오신 것을 환영합니다! (문의: 033-439-5800)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/12/3580712_image2_1.JPG',0.0,'2026-01-23 04:44:01'),(22,'안성 동막골 빙어축제','축제','경기도','경기도 안성시 죽산면 곰내미길 48','2026-01-17','2026-02-17',NULL,NULL,'안성 동막골 빙어축제에 오신 것을 환영합니다! (문의: 031-674-4528)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/01/3590201_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(23,'양평빙송어축제','축제','경기도','경기도 양평군 곱다니길 55-2','2025-12-06','2026-03-02',NULL,NULL,'양평빙송어축제에 오신 것을 환영합니다! (문의: 031-775-5205)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/93/3108393_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(24,'영주 한국선비문화축제','축제','경상북도','경상북도 영주시 순흥면 선비세상로 1','2026-05-02','2026-05-05',NULL,NULL,'영주 한국선비문화축제에 오신 것을 환영합니다! (문의: 054-630-8703)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/40/4001440_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(25,'영동곶감축제','축제','충청북도','충청북도 영동군 영동읍 계산리','2026-01-30','2026-02-01',NULL,NULL,'영동곶감축제에 오신 것을 환영합니다! (문의: 043-745-8922)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/18/3586818_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(26,'고창모양성제','축제','전북특별자치도','전북특별자치도 고창군 고창읍 모양성로 11','2026-10-15','2026-10-19',NULL,NULL,'고창모양성제에 오신 것을 환영합니다! (문의: 063-560-2949)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/30/3519730_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(27,'이천도자기축제','축제','경기도','경기도 이천시 신둔면 도자예술로5번길 109','2026-04-24','2026-05-05',NULL,NULL,'이천도자기축제에 오신 것을 환영합니다! (문의: 031-645-3683)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/09/4004509_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(28,'얼음나라화천 산천어축제','축제','강원특별자치도','강원특별자치도 화천군 화천읍 산천어길 137','2026-01-10','2026-02-01',NULL,NULL,'얼음나라화천 산천어축제에 오신 것을 환영합니다! (문의: 1688-3005)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/00/3064900_image2_1.png',0.0,'2026-01-23 04:44:01'),(29,'홍성남당항 새조개축제','축제','충청남도','충청남도 홍성군 서부면 남당항로213번길 1-1','2026-01-17','2026-04-30',NULL,NULL,'홍성남당항 새조개축제에 오신 것을 환영합니다! (문의: 010-5433-8196)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/69/3469769_image2_1.JPG',0.0,'2026-01-23 04:44:01'),(30,'대관령눈꽃축제','축제','강원특별자치도','강원특별자치도 평창군 대관령로 135-9','2026-02-13','2026-02-22',NULL,NULL,'대관령눈꽃축제에 오신 것을 환영합니다! (문의: 033-335-3995)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/89/3588789_image2_1.JPG',0.0,'2026-01-23 04:44:01'),(31,'사천에어쇼','축제','경상남도','경상남도 사천시 사천읍 정의리','2026-10-22','2026-10-25',NULL,NULL,'사천에어쇼에 오신 것을 환영합니다! (문의: 055-831-2061)',NULL,0,0,0,NULL,NULL,NULL,NULL,'http://tong.visitkorea.or.kr/cms/resource/49/3566649_image2_1.png',0.0,'2026-01-23 04:44:01'),(32,'서울 왕궁수문장 교대의식','축제','서울특별시','서울특별시 중구 세종대로 99 (정동)','2026-01-01','2026-12-31',NULL,NULL,'서울 왕궁수문장 교대의식에 오신 것을 환영합니다! (문의: 02-6242-7402)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/23/4003323_image2_1.jpg',0.0,'2026-01-23 04:44:01'),(33,'단종문화제','축제','강원특별자치도','강원특별자치도 영월군 영월읍 하송리','2026-04-24','2026-04-26',NULL,NULL,'단종문화제에 오신 것을 환영합니다! (문의: 033-375-6372)',NULL,0,0,0,NULL,NULL,NULL,NULL,'https://tong.visitkorea.or.kr/cms/resource/21/4004221_image2_1.jpg',0.0,'2026-01-23 04:44:01');
/*!40000 ALTER TABLE `festivals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parties`
--

DROP TABLE IF EXISTS `parties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parties` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '방장 ID',
  `festival_id` int NOT NULL COMMENT '관련 축제 ID',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제목',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '상세 내용',
  `conditions` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '모집 조건 (예: 20대만)',
  `contact_method` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '연락 방법 (오픈채팅 등)',
  `deadline_notice` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '마감 안내 멘트',
  `max_members` int DEFAULT '4' COMMENT '최대 인원',
  `meet_date` datetime NOT NULL COMMENT '만나는 날짜/시간',
  `status` enum('RECRUITING','CLOSED','COMPLETED') COLLATE utf8mb4_unicode_ci DEFAULT 'RECRUITING',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `festival_id` (`festival_id`),
  CONSTRAINT `parties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `parties_ibfk_2` FOREIGN KEY (`festival_id`) REFERENCES `festivals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parties`
--

LOCK TABLES `parties` WRITE;
/*!40000 ALTER TABLE `parties` DISABLE KEYS */;
INSERT INTO `parties` VALUES (1,1,2,'서울 빛초롱 축제 같이 가실 분 (2/4명)','사진 찍는 거 좋아하시는 분 환영해요!','20대 대학생 누구나','카톡 오픈채팅 링크',NULL,4,'2024-11-30 18:00:00','RECRUITING','2026-01-23 03:10:28'),(2,2,3,'부산 불꽃 축제 명당 자리 잡아요','일찍 가서 자리 맡으실 분 구함','체력 좋으신 분','DM 주세요',NULL,4,'2024-12-05 15:00:00','RECRUITING','2026-01-23 03:10:28');
/*!40000 ALTER TABLE `parties` ENABLE KEYS */;
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

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '로그인 아이디',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '비밀번호 (소셜 로그인은 NULL)',
  `nickname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '닉네임',
  `profile_image` text COLLATE utf8mb4_unicode_ci COMMENT '프로필 사진 URL',
  `level` int DEFAULT '1' COMMENT '문화유목민 레벨 (Lv.1, Lv.2...)',
  `provider` enum('LOCAL','KAKAO','NAVER','GOOGLE') COLLATE utf8mb4_unicode_ci DEFAULT 'LOCAL' COMMENT '가입 경로',
  `sns_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '소셜 로그인 고유 ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test@naver.com','1234','문화유목민',NULL,1,'LOCAL',NULL,'2026-01-23 03:10:28'),(2,'admin@naver.com','1234','축제마스터',NULL,5,'LOCAL',NULL,'2026-01-23 03:10:28'),(3,'party@naver.com','1234','파티피플',NULL,3,'LOCAL',NULL,'2026-01-23 03:10:28');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-24 15:17:16
