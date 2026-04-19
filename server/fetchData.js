import axios from 'axios';
import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'appuser',
    password: '1234',
    database: 'culture_wanderers'
};

const SERVICE_KEY = '5c80008379c831a9102fb718ad0edf12fb389dc497831457c51c5387c378aa31';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getCultureData() {
    let connection;

    try {
        console.log("DB 연결 시도 중...");
        connection = await mysql.createConnection(dbConfig);
        console.log("DB 연결 성공");

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

        // 목록 수집
        const url = `http://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&numOfRows=100&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=${today}&arrange=R`;

        const res = await axios.get(url);
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
                await sleep(1500);

                // 1. Intro API
                const introUrl = `http://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${SERVICE_KEY}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&contentTypeId=15`;
                const introRes = await axios.get(introUrl);
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

                await sleep(1000);

                // 2. Common API
                const commonUrl = `http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${SERVICE_KEY}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&defaultYN=Y&firstImageYN=Y&overviewYN=Y&homepageYN=Y`;
                const commonRes = await axios.get(commonUrl);
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
                // 기존 데이터 확인
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

                    // 기존에 수기로 넣은 homepage_url이 있으면 그 값을 우선 보존
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