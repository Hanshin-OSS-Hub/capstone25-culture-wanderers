import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 4/19 server 폴더에서 실행해도 루트 .env를 읽도록 수정
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: 'localhost',
    user: 'appuser',
    password: '1234',
    database: 'culture_wanderers'
};

// 4/19 API 호출 간격 제어용 sleep 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 4/19 서비스키를 환경변수에서 읽도록 수정
const SERVICE_KEY = process.env.SERVICE_KEY;

console.log('SERVICE_KEY loaded:', !!SERVICE_KEY);
console.log('SERVICE_KEY preview:', SERVICE_KEY ? SERVICE_KEY.slice(0, 10) + '...' : 'undefined');

// 4/19 공공데이터 API 429 대응용 재시도 함수
async function getWithRetry(url, maxRetry = 3, delay = 3000) {
    for (let attempt = 1; attempt <= maxRetry; attempt++) {
        try {
            return await axios.get(url);
        } catch (error) {
            const status = error?.response?.status;

            if (status === 429 && attempt < maxRetry) {
                console.log(`  - 429 발생, ${delay}ms 후 재시도 (${attempt}/${maxRetry})`);
                await sleep(delay);
                delay *= 2;
                continue;
            }

            throw error;
        }
    }
}

async function getCultureData() {
    let connection;

    try {
        console.log("DB 연결 시도 중...");
        connection = await mysql.createConnection(dbConfig);
        console.log("DB 연결 성공");

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

        const url = `http://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=100&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=${today}&arrange=R`;

        const res = await getWithRetry(url, 3, 5000);
        const items = res.data?.response?.body?.items?.item || [];
        const list = Array.isArray(items) ? items : [items];

        console.log(`총 ${list.length}개 축제 데이터 수집 시작`);

        for (const item of list) {
            if (!item?.contentid) continue;

            console.log(`\n[작업 시작] ${item.title}`);

            let price = "정보 없음";
            let tel = item.tel || "정보 없음";
            let desc = "상세 정보 준비 중";
            let homepage = "";
            let thumbnail = item.firstimage || null;
            const title = item.title || "제목 없음";
            const region = (item.addr1 || "기타").split(" ")[0];
            const location = item.addr1 || "장소 미정";
            const startDate = item.eventstartdate || null;
            const endDate = item.eventenddate || null;
            const category = "축제";

            try {
                await sleep(3000);

                // 1. Intro API
                const introUrl = `http://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&contentTypeId=15`;
                const introRes = await getWithRetry(introUrl, 3, 5000);
                const introRaw = introRes.data?.response?.body?.items?.item;
                const intro = Array.isArray(introRaw) ? introRaw[0] : introRaw;

                if (intro) {
                    price = intro.usetimefestival || price;
                    tel = intro.infocentre || tel;

                    if (intro.program) {
                        desc = intro.program;
                        console.log("  - Intro에서 프로그램 정보 추출 성공");
                    }
                }

                await sleep(3000);

                // 2. Common API
                const commonUrl = `http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&defaultYN=Y&firstImageYN=Y&overviewYN=Y&homepageYN=Y`;
                const commonRes = await getWithRetry(commonUrl, 3, 5000);
                const commonRaw = commonRes.data?.response?.body?.items?.item;
                const common = Array.isArray(commonRaw) ? commonRaw[0] : commonRaw;

                // 핵심 수정:
                // overview가 없어도 homepage는 따로 저장되게 분리
                if (common) {
                    if (common.homepage) {
                        homepage = common.homepage;
                        console.log("  - Common에서 홈페이지 수집 성공");
                    }

                    if (common.overview) {
                        desc = common.overview;
                        console.log("  - Common에서 상세 설명(overview) 수집 성공");
                    }

                    if (common.firstimage && !thumbnail) {
                        thumbnail = common.firstimage;
                    }
                }

            } catch (apiErr) {
                console.error(`  - API 수집 중 일부 실패: ${apiErr.message}`);
            }

            try {
                const [existingRows] = await connection.execute(
                    `
                    SELECT id, homepage_url
                    FROM festivals
                    WHERE title = ? AND start_date = ? AND location = ?
                    LIMIT 1
                    `,
                    [title, startDate, location]
                );

                if (existingRows.length > 0) {
                    const existing = existingRows[0];

                    const finalHomepage =
                        existing.homepage_url && existing.homepage_url.trim() !== ''
                            ? existing.homepage_url
                            : (homepage || '');

                    await connection.execute(
                        `
                        UPDATE festivals
                        SET region = ?,
                            end_date = ?,
                            thumbnail_url = ?,
                            category = ?,
                            price = ?,
                            description = ?,
                            tel = ?,
                            homepage_url = ?
                        WHERE id = ?
                        `,
                        [
                            region,
                            endDate,
                            thumbnail,
                            category,
                            String(price),
                            String(desc),
                            String(tel),
                            String(finalHomepage),
                            existing.id
                        ]
                    );

                    console.log(`  - 기존 데이터 UPDATE 완료 (id: ${existing.id})`);
                } else {
                    await connection.execute(
                        `
                        INSERT INTO festivals
                        (
                            title,
                            region,
                            location,
                            start_date,
                            end_date,
                            thumbnail_url,
                            category,
                            price,
                            description,
                            tel,
                            homepage_url
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `,
                        [
                            title,
                            region,
                            location,
                            startDate,
                            endDate,
                            thumbnail,
                            category,
                            String(price),
                            String(desc),
                            String(tel),
                            String(homepage || '')
                        ]
                    );

                    console.log(`  - 신규 데이터 INSERT 완료`);
                }
            } catch (dbErr) {
                console.error(`  - DB 저장 실패: ${dbErr.message}`);
            }
        }
    } catch (error) {
        console.error("전체 프로세스 에러:", error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
        console.log("\n--- 수집 완료 ---");
    }
}

getCultureData();