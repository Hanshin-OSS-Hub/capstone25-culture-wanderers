import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseStringPromise } from 'xml2js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    host: 'localhost',
    user: 'appuser',
    password: '1234',
    database: 'culture_wanderers'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const SERVICE_KEY = process.env.SERVICE_KEY;
const SEOUL_API_KEY = process.env.SEOUL_API_KEY;
const GG_API_KEY = process.env.GG_API_KEY;

const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/<br\s*\/?>/gi, "\n").replace(/(<([^>]+)>)/gi, "").trim();
};

const sanitizeDate = (dateStr, fallbackDate = "20260101") => {
    if (!dateStr) return fallbackDate;
    const cleaned = String(dateStr).replace(/[^0-9]/g, "");
    if (cleaned.length < 8) return fallbackDate;
    return cleaned.substring(0, 8);
};

const shouldSkip = (title) => {
    const skipKeywords = [
        '공모', '대관', '모집', '신청', '서포터즈', 
        '프로그램', '안내', '공고', '지원사업', '채용', 
        '입찰', '선발', '교육생', '강사', '원생', '연구', '구입', '대학교', '캠퍼스',
        '양성', '교육'
    ];
    return skipKeywords.some(keyword => title.includes(keyword));
};

const determineCategory = (title, defaultCat) => {
    if (title.includes('체험') || title.includes('교육') || title.includes('워크숍')) return '체험';
    if (title.includes('공연') || title.includes('음악회') || title.includes('콘서트') || 
        title.includes('연주회') || title.includes('뮤지컬') || title.includes('연극')) {
        return '공연';
    }
    return defaultCat;
};

async function saveToDatabase(connection, data, isGG = false) {
    if (shouldSkip(data.title)) {
        console.log(`[필터링 스킵] 공고성 데이터 제외: ${data.title}`);
        return;
    }

    const finalCategory = determineCategory(data.title, data.category);
    const prefix = isGG ? "[경기도]" : `[${data.region || '기타'}]`;

    const [existing] = await connection.execute(
        `SELECT id FROM festivals WHERE REPLACE(title, ' ', '') = ? LIMIT 1`, 
        [data.title.replace(/\s+/g, "")]
    );

    if (existing.length > 0) {
        await connection.execute(
            `UPDATE festivals SET region=?, start_date=?, end_date=?, thumbnail_url=?, category=?, price=?, description=?, tel=?, homepage_url='', location=? WHERE id=?`, 
            [data.region, data.startDate, data.endDate, data.thumbnailUrl, finalCategory, String(data.price), String(data.description), String(data.tel), data.location, existing[0].id]
        );
        console.log(`${prefix} [업데이트 완료] ${finalCategory}: ${data.title}`);
    } else {
        await connection.execute(
            `INSERT INTO festivals (title, region, location, start_date, end_date, thumbnail_url, category, price, description, tel, homepage_url) VALUES (?,?,?,?,?,?,?,?,?,?,'')`, 
            [data.title, data.region, data.location, data.startDate, data.endDate, data.thumbnailUrl, finalCategory, String(data.price), String(data.description), String(data.tel)]
        );
        console.log(`${prefix} [신규 저장 완료] ${finalCategory}: ${data.title}`);
    }
}

async function getCultureData() {
    let connection;
    try {
        console.log("DB 연결 시도 중...");
        connection = await mysql.createConnection(dbConfig);
        console.log("DB 연결 성공");

        await connection.execute(`SET SQL_SAFE_UPDATES = 0;`);

        // ==========================================
        // 1. 한국관광공사 파트
        // ==========================================
        const taskList = [
            { type: '15', catName: '축제', url: `http://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=20260101&arrange=R` },
            { type: '14', catName: '전시', url: `http://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfRows=10&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&contentTypeId=14&arrange=R` }
        ];

        for (const task of taskList) {
            console.log(`\n--- [관광공사 ${task.catName}] 수집 시작 ---`);
            const res = await getWithRetry(task.url);
            const items = res.data?.response?.body?.items?.item || [];
            const list = Array.isArray(items) ? items : [items];

            for (const item of list) {
                if (!item?.contentid) continue;

                let price = "정보 없음", tel = item.tel || "정보 없음", finalDescription = "", homepage_url = "";
                let useTime = "정보 없음", restDate = "정보 없음";
                let programInfo = "", overviewDesc = "";
                let thumbnail = item.firstimage || null;
                const title = item.title || "";
                const region = (item.addr1 || "기타").split(" ")[0];
                const location = item.addr1 || "장소 미정";
                
                const startDate = sanitizeDate(item.eventstartdate, "20260101");
                const endDate = task.catName === '전시' ? null : sanitizeDate(item.eventenddate, startDate);

                try {
                    await sleep(1200); 
                    const introRes = await getWithRetry(`http://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&contentTypeId=${task.type}`);
                    const intro = Array.isArray(introRes.data?.response?.body?.items?.item) ? introRes.data?.response?.body?.items?.item[0] : introRes.data?.response?.body?.items?.item;

                    if (intro) {
                        price = cleanText(intro.usetimefestival || intro.usefee) || price;
                        if (intro.program) programInfo = cleanText(intro.program);
                        tel = intro.infocentre || intro.infocenterculture || tel;
                        
                        if (task.type === '14') {
                            useTime = cleanText(intro.usetime) || "정보 없음";
                            restDate = cleanText(intro.restdateculture || intro.restdate) || "정보 없음";
                        }
                    }

                    await sleep(1000); 
                    const commonRes = await getWithRetry(`http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&defaultYN=Y&firstImageYN=Y&overviewYN=Y&homepageYN=Y`);
                    const common = Array.isArray(commonRes.data?.response?.body?.items?.item) ? commonRes.data?.response?.body?.items?.item[0] : commonRes.data?.response?.body?.items?.item;

                    if (common) {
                        let rawUrl = common.homepage ? common.homepage.match(/href="([^"]+)"/)?.[1] : "";
                        homepage_url = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : "";
                        overviewDesc = cleanText(common.overview);
                        thumbnail = thumbnail || common.firstimage || common.firstimage2;
                    }

                    let infoSection = `[이용 요금] ${price}\n`;
                    if (task.type === '14') {
                        infoSection += `[이용 시간] ${useTime}\n[휴무일] ${restDate}\n`;
                    }
                    infoSection += `[문의처] ${tel}\n`;
                    if (homepage_url) {
                        infoSection += `[홈페이지] ${homepage_url}\n`;
                    }
                    
                    const mainContent = programInfo ? `${programInfo}\n\n${overviewDesc}` : overviewDesc;
                    finalDescription = infoSection + "\n[소개]\n" + (mainContent || "상세 소개 정보가 준비 중입니다.");

                    await saveToDatabase(connection, {
                        title, region, location, startDate, endDate, thumbnailUrl: thumbnail,
                        category: task.catName, description: finalDescription, tel, price
                    }, false);
                } catch (e) { console.error(`  - 에러: ${e.message}`); }
            }
        }

        // ==========================================
        // 2. 한국문화정보원 파트
        // ==========================================
        console.log(`\n--- [문화정보포털] 상세 수집 시작 ---`);
        const portalUrl = `https://apis.data.go.kr/B553457/cultureinfo/realm2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&numOfrows=10&pageNo=1`;
        const portalRes = await axios.get(portalUrl, { responseType: 'text' });
        const portalData = await parseStringPromise(portalRes.data);
        const portalItems = portalData?.response?.body?.[0]?.items?.[0]?.item || [];

        for (const pItem of portalItems) {
            const pTitle = cleanText(pItem.title?.[0]);
            const pSeq = pItem.seq?.[0];
            
            const pStartDate = sanitizeDate(pItem.startDate?.[0], "20260101");
            const pEndDate = sanitizeDate(pItem.endDate?.[0], pStartDate);

            let pThumbnail = null, pDesc = "상세 정보 없음", pTel = "정보 없음", pPrice = "정보 없음", pUrl = "";

            if (pSeq) {
                await sleep(1000);
                const dRes = await axios.get(`https://apis.data.go.kr/B553457/cultureinfo/detail2?serviceKey=${encodeURIComponent(SERVICE_KEY)}&seq=${pSeq}`, { responseType: 'text' });
                const dResult = await parseStringPromise(dRes.data);
                const d = dResult?.response?.body?.[0]?.items?.[0]?.item?.[0];
                
                if (d) {
                    pThumbnail = d.imgUrl?.[0] || null;
                    pTel = cleanText(d.phone?.[0]) || "정보 없음";
                    pPrice = cleanText(d.price?.[0]) || "정보 없음";
                    let rawUrl = d.url?.[0] || "";
                    pUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : "";
                    
                    let pInfo = `[이용 요금] ${pPrice}\n[문의처] ${pTel}\n`;
                    if (pUrl) {
                        pInfo += `[홈페이지] ${pUrl}\n`;
                    }
                    pDesc = pInfo + "\n[소개]\n" + cleanText(d.contents1?.[0]);
                }
            }

            const location = pItem.place?.[0] || "장소 미정";
            const region = (pItem.place?.[0] || "기타").split(" ")[0];

            await saveToDatabase(connection, {
                title: pTitle, region, location, startDate: pStartDate, endDate: pEndDate,
                thumbnailUrl: pThumbnail, category: '전시', description: pDesc, tel: pTel, price: pPrice
            }, false);
            console.log(`[성공] 문화포털: ${pTitle}`);
        }

        // ==========================================
        // 3. 서울특별시 문화행사 파트
        // ==========================================
        console.log(`\n--- [서울특별시] 문화행사 수집 시작 ---`);
        if (SEOUL_API_KEY) {
            try {
                const seoulUrl = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/culturalEventInfo/1/10/`;
                const sRes = await axios.get(seoulUrl, { timeout: 7000 });
                const sRows = sRes.data?.culturalEventInfo?.row || [];

                for (const item of sRows) {
                    const sStartDate = sanitizeDate(item.STRTDATE, "20260101");
                    const sEndDate = sanitizeDate(item.END_DATE, sStartDate);

                    const sTel = item.INQUIRY || '정보 없음';
                    const sPrice = item.USE_FEE || '정보 없음';
                    const sLocation = item.PLACE || "장소 미정";
                    
                    let sInfo = `[이용 요금] ${sPrice}\n[문의처] ${sTel}\n`;
                    if (item.ORG_LINK) {
                        const sUrl = item.ORG_LINK.startsWith('http') ? item.ORG_LINK : `https://${item.ORG_LINK}`;
                        sInfo += `[홈페이지] ${sUrl}\n`;
                    }
                    const sDesc = sInfo + `\n[소개]\n서울시 제공 행사 정보입니다. 대상: ${item.USE_TRGT || '제한 없음'}`;
                    
                    await saveToDatabase(connection, {
                        title: cleanText(item.TITLE), region: '서울', location: sLocation,
                        startDate: sStartDate, endDate: sEndDate, thumbnailUrl: item.MAIN_IMG,
                        category: item.CODENAME.includes('전시') ? '전시' : '축제',
                        description: sDesc, tel: sTel, price: sPrice
                    }, false);
                }
            } catch (err) { 
                console.warn(`[서울시 API 건너뛰기] 서버 먹통 또는 응답 지연: ${err.message}`); 
            }
        }

        // ==========================================
        // 4. 경기도 문화행사 파트 (300개 확장 및 검색어 기반 주소 바인딩)
        // ==========================================
        console.log(`\n--- [경기도] 문화행사 수집 시작 ---`);
        if (GG_API_KEY) {
            try {
                const ggUrl = 'https://openapi.gg.go.kr/GGCULTUREVENTSTUS';
                
                // 최신 유효 데이터를 다수 확보하기 위해 pSize를 300으로 지정합니다.
                const gRes = await axios.get(ggUrl, {
                    params: {
                        KEY: GG_API_KEY,
                        Type: 'json',
                        pIndex: 1,  
                        pSize: 300
                    },
                    timeout: 7000
                });
                
                const gResult = gRes.data?.GGCULTUREVENTSTUS;
                const gRows = gResult?.[1]?.row || [];

                const safeString = (val, fallback = "정보 없음") => {
                    if (!val) return fallback;
                    if (typeof val === 'object') {
                        if (val._text !== undefined) return String(val._text);
                        if (val._cdata !== undefined) return String(val._cdata);
                        if (val.value !== undefined) return String(val.value);
                        
                        const keys = Object.keys(val);
                        if (keys.length === 1) return String(val[keys[0]]);
                        return fallback;
                    }
                    return String(val).trim();
                };

                for (const item of gRows) {
                    const gTitle = cleanText(safeString(item.TITLE || item.TITLE_NM));
                    if (!gTitle || gTitle === "정보 없음") continue;

                    if (shouldSkip(gTitle)) continue;

                    const gStartDate = sanitizeDate(safeString(item.BEGIN_DE || item.BGNG_DE), "20260101");
                    const gEndDate = sanitizeDate(safeString(item.END_DE), gStartDate);
                    
                    // 오래된 데이터는 거르고 유효 데이터를 보존합니다.
                    if (gEndDate < "20250101") {
                        continue;
                    }

                    const gLocation = cleanText(safeString(item.HOST_INST_NM || item.INST_NM, "장소 미정"));
                    const gTel = cleanText(safeString(item.TELNO_INFO || item.TELNO));
                    
                    let gPrice = cleanText(safeString(item.PARTCPT_EXPN_INFO || item.EXPN, "무료"));
                    if (gPrice === "무") gPrice = "무료"; 

                    let gThumbnail = safeString(item.IMAGE_URL || item.IMAGE_URL_NM || item.FILE_NM);
                    if (!gThumbnail || gThumbnail.includes('[object') || !gThumbnail.startsWith('http')) {
                        gThumbnail = ""; 
                    }

                    const generatedLink = `https://search.naver.com/search.naver?query=${encodeURIComponent(gTitle)}`;

                    let gInfo = `[이용 요금] ${gPrice}\n[문의처] ${gTel}\n`;
                    gInfo += `[홈페이지] ${generatedLink}\n`;

                    const gDesc = gInfo + `\n[소개]\n경기도 내에서 진행되는 ${safeString(item.CATEGORY_NM || '문화예술')} 행사입니다. 시민 여러분의 많은 참여와 관심 부탁드립니다.`;
                    const finalCategory = item.CATEGORY_NM ? safeString(item.CATEGORY_NM) : determineCategory(gTitle, '축제');

                    const finalEndDate = finalCategory.includes('전시') ? null : gEndDate;

                    await saveToDatabase(connection, {
                        title: gTitle, region: '경기', location: gLocation,      
                        startDate: gStartDate, endDate: finalEndDate, thumbnailUrl: gThumbnail, 
                        category: finalCategory, description: gDesc, tel: gTel, price: gPrice
                    }, true);
                }
            } catch (err) { 
                console.warn(`[경기도 API 건너뛰기] 서버 먹통 또는 응답 지연: ${err.message}`); 
            }
        }

    } catch (error) { console.error("전체 프로세스 에러:", error.message); }
    finally {
        if (connection) {
            try { await connection.execute(`SET SQL_SAFE_UPDATES = 1;`); } catch(e){}
            await connection.end();
        }
        console.log("\n--- 모든 데이터 대량 통합 수집 완료 ---");
    }
}

async function getWithRetry(url, maxRetry = 3, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetry; attempt++) {
        try {
            return await axios.get(url, { timeout: 6000 }); 
        } catch (error) {
            if (error?.response?.status === 429 && attempt < maxRetry) {
                await sleep(delay);
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
}

getCultureData();