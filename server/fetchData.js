import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Project2025!',
    database: 'culture_wanderers'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const SERVICE_KEY = process.env.SERVICE_KEY;

const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/<br\s*\/?>/gi, "\n").replace(/(<([^>]+)>)/gi, "").trim();
};

async function getWithRetry(url, maxRetry = 3, delay = 5000) {
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

        const taskList = [
            { type: '15', catName: '축제', url: `http://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=300&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=${today}&arrange=R` },
            { type: '14', catName: '전시', url: `http://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=300&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&contentTypeId=14&arrange=R` }
        ];

        for (const task of taskList) {
            console.log(`\n--- [${task.catName}] 정밀 수집 시작 ---`);
            const res = await getWithRetry(task.url);
            const items = res.data?.response?.body?.items?.item || [];
            const list = Array.isArray(items) ? items : [items];

            for (const item of list) {
                if (!item?.contentid) continue;
                console.log(`[작업 시작] ${item.title}`);

                let price = "정보 없음", tel = item.tel || "정보 없음", finalDescription = "", homepage_url = "";
                let timeInfo = "", restInfo = "", programInfo = "", overviewDesc = "";
                let thumbnail = item.firstimage || null;
                const title = item.title || "";
                const region = (item.addr1 || "기타").split(" ")[0];
                const location = item.addr1 || "장소 미정";
                const startDate = item.eventstartdate || today;
                const endDate = item.eventenddate || null;

                try {
                    await sleep(3500);

                    const introUrl = `http://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&contentTypeId=${task.type}`;
                    const introRes = await getWithRetry(introUrl);
                    const introRaw = introRes.data?.response?.body?.items?.item;
                    const intro = Array.isArray(introRaw) ? introRaw[0] : introRaw;

                    if (intro) {
                        if (task.type === '14') {
                            timeInfo = cleanText(intro.usetimeculture);
                            restInfo = cleanText(intro.restdateculture || intro.restdate);
                            price = cleanText(intro.usefee) || price;
                        } else {
                            price = cleanText(intro.usetimefestival) || price;
                            if (intro.program) programInfo = cleanText(intro.program);
                        }
                        tel = intro.infocentre || intro.infocenterculture || tel;
                    }

                    await sleep(3500);

                    const commonUrl = `http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&defaultYN=Y&firstImageYN=Y&overviewYN=Y&homepageYN=Y`;
                    const commonRes = await getWithRetry(commonUrl);
                    const commonRaw = commonRes.data?.response?.body?.items?.item;
                    const common = Array.isArray(commonRaw) ? commonRaw[0] : commonRaw;

                    if (common) {
                        homepage_url = common.homepage || "";
                        overviewDesc = cleanText(common.overview);
                        if (!thumbnail || thumbnail === "null") {
                            thumbnail = common.firstimage || common.firstimage2 || null;
                        }
                    }

                    if (task.type === '14') {
                        let displayInfo = "";
                        if (timeInfo) displayInfo += `🕒 이용시간: ${timeInfo}\n`;
                        if (restInfo) displayInfo += `❌ 휴무일: ${restInfo}\n`;
                        if (price && price !== "정보 없음") displayInfo += `💰 요금: ${price}\n`;
                        if (displayInfo) displayInfo += `\n--------------------------\n\n`;
                        finalDescription = displayInfo + (overviewDesc || "");
                    } else {
                        finalDescription = programInfo || overviewDesc || "";
                    }

                } catch (apiErr) {
                    console.error(`  - API 상세 수집 실패: ${apiErr.message}`);
                }

                try {
                    const [existing] = await connection.execute(
                        `SELECT id FROM festivals WHERE title = ? AND start_date = ? LIMIT 1`,
                        [title, startDate]
                    );

                    const dbThumbnail = (thumbnail && thumbnail !== "null") ? thumbnail : null;

                    if (existing.length > 0) {
                        await connection.execute(
                            `UPDATE festivals SET region=?, end_date=?, thumbnail_url=?, category=?, price=?, description=?, tel=?, homepage_url=?, location=? WHERE id=?`,
                            [region, endDate, dbThumbnail, task.catName, String(price), String(finalDescription), String(tel), String(homepage_url), location, existing[0].id]
                        );
                        console.log(`  - [성공] 업데이트 완료: ${title}`);
                    } else {
                        await connection.execute(
                            `INSERT INTO festivals (title, region, location, start_date, end_date, thumbnail_url, category, price, description, tel, homepage_url) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                            [title, region, location, startDate, endDate, dbThumbnail, task.catName, String(price), String(finalDescription), String(tel), String(homepage_url)]
                        );
                        console.log(`  - [성공] 신규 추가 완료: ${title}`);
                    }
                } catch (dbErr) {
                    console.error(`  - DB 작업 실패: ${dbErr.message}`);
                }
            }
        }
    } catch (error) {
        console.error("전체 프로세스 에러:", error.message);
    } finally {
        if (connection) await connection.end();
        console.log("\n--- 모든 수집 작업 완료 ---");
    }
}

getCultureData();