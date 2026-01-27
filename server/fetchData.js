import axios from 'axios';
import mysql from 'mysql2/promise';

//DB 설정 (비밀번호 변경)
const dbConfig = {
    host: 'localhost', 
    user: 'root', 
    password: 'root', 
    database: 'culture_wanderers' 
};

const SERVICE_KEY = '5c80008379c831a9102fb718ad0edf12fb389dc497831457c51c5387c378aa31';

async function getCultureData() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

        console.log("데이터 수집");
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE festivals');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const types = [
            { id: '15', name: '축제', url: `http://apis.data.go.kr/B551011/KorService2/searchFestival2?serviceKey=${SERVICE_KEY}&numOfRows=30&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&eventStartDate=${today}&arrange=R` },
            { id: '14', name: '전시', url: `http://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${SERVICE_KEY}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&contentTypeId=14&keyword=${encodeURI('전시')}&arrange=R` },
            { id: '14', name: '공연', url: `http://apis.data.go.kr/B551011/KorService2/searchKeyword2?serviceKey=${SERVICE_KEY}&numOfRows=20&pageNo=1&MobileOS=ETC&MobileApp=AppTest&_type=json&contentTypeId=14&keyword=${encodeURI('공연')}&arrange=R` }
        ];

        for (const type of types) {
            const res = await axios.get(type.url);
            const items = res.data?.response?.body?.items?.item || [];
            const list = Array.isArray(items) ? items : [items];

            for (const item of list) {
                if (!item.contentid) continue;
                let price = "정보 없음", tel = item.tel || "정보 없음", desc = "";

                try {
                    await new Promise(r => setTimeout(r, 700)); // API 차단 방지
                    const introRes = await axios.get(`http://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${SERVICE_KEY}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&contentTypeId=${type.id}`);
                    const intro = introRes.data?.response?.body?.items?.item?.[0];
                    if (intro) {
                        price = (type.id === '15' ? intro.usetimefestival : (intro.usefee || intro.usetime)) || price;
                        tel = (type.id === '15' ? intro.infocentre : intro.infocenterculture) || tel;
                    }
                    const commonRes = await axios.get(`http://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${SERVICE_KEY}&MobileOS=ETC&MobileApp=AppTest&_type=json&contentId=${item.contentid}&overviewYN=Y`);
                    desc = commonRes.data?.response?.body?.items?.item?.[0]?.overview || "";
                } catch (e) { }

                await connection.execute(
                    `INSERT INTO festivals (title, region, location, start_date, end_date, thumbnail_url, category, price, description, tel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.title || "제목 없음",
                        (item.addr1 || "기타").split(" ")[0],
                        item.addr1 || "장소 미정",
                        item.eventstartdate || null, // undefined 방지
                        item.eventenddate || null,   // undefined 방지
                        item.firstimage || null,
                        type.name,
                        String(price || "정보 없음"), // String으로 감싸서 에러 방지
                        String(desc || "상세 정보 준비 중"),
                        String(tel || "정보 없음")
                    ]
                );
                process.stdout.write(".");
            }
        }
    } finally { if (connection) connection.end(); console.log("\n 수집 완료!"); }
}
getCultureData();