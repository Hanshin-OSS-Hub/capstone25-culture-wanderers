import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// DB 설정 (비밀번호 변경)
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Project2025!',
    database: 'culture_wanderers'
};

// 프론트엔드와 데이터 변수를 맞춰주는 함수
const adaptFestivalData = (data) => {
    if (!data) return null;
    return {
        ...data,
        tel: data.tel || "정보 없음",
        price: data.price || "무료 (상세 확인)",
        description: data.description || "상세 정보 준비 중입니다."
    };
};

// 1. 축제 전체 리스트
app.get('/api/festivals', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM festivals ORDER BY start_date ASC');
        res.json(rows.map(row => adaptFestivalData(row)));
    } catch (error) {
        res.status(500).send("DB 조회 실패");
    } finally {
        if (connection) connection.end();
    }
});

// 2. 축제 검색 및 필터 API (약어 매칭 보강)
app.get('/api/festivals/search', async (req, res) => {
    let connection;
    try {
        const { q, region, category, date, free, maxPrice } = req.query;
        let sql = `SELECT * FROM festivals WHERE 1=1`;
        const params = [];

        // 키워드 검색
        if (q && q.trim() !== '') {
            sql += ` AND (title LIKE ? OR description LIKE ? OR location LIKE ? OR region LIKE ?)`;
            const like = `%${q.trim()}%`;
            params.push(like, like, like, like);
        }

        // 지역 필터 (충남/경남 등 약어 대응)
        if (region && region !== '전체') {
            const regionMap = {
                '경남': '경상남도', '경북': '경상북도',
                '전남': '전라남도', '전북': '전라북도',
                '충남': '충청남도', '충북': '충청북도',
                '강원': '강원도', '경기': '경기도',
                '제주': '제주'
            };

            if (regionMap[region]) {
                // 약어(경남)와 풀네임(경상남도) 둘 중 하나라도 포함되면 검색
                sql += ` AND (region LIKE ? OR region LIKE ?)`;
                params.push(`%${region}%`, `%${regionMap[region]}%`);
            } else {
                // 서울, 인천 등 일반 지역
                sql += ` AND region LIKE ?`;
                params.push(`%${region}%`);
            }
        }

        // 카테고리 필터
        if (category && category !== '전체') {
            sql += ` AND category = ?`;
            params.push(category);
        }

        // 날짜 검색
        if (date) {
            sql += ` AND DATE(start_date) <= ? AND DATE(end_date) >= ?`;
            params.push(date, date);
        }

        // 무료 필터
        if (free === '1') {
            sql += ` AND (price = 0 OR price IS NULL OR price LIKE '%무료%')`;
        }

        // 가격 상한
        const max = Number.isFinite(Number(maxPrice)) ? Number(maxPrice) : null;
        if (max !== null) {
            sql += ` AND (price <= ? OR price IS NULL)`;
            params.push(max);
        }

        sql += ` ORDER BY start_date ASC`;

        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(sql, params);
        
        console.log(`필터 결과: ${rows.length}개 (지역: ${region || '전체'})`);
        res.json(rows.map(row => adaptFestivalData(row)));
    } catch (error) {
        console.error("검색 에러:", error);
        res.status(500).send("검색 실패");
    } finally {
        if (connection) connection.end();
    }
});

// 3. 상세 페이지 API
app.get('/api/festivals/:id', async (req, res) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM festivals WHERE id = ?', [req.params.id]);
        if (rows.length > 0) res.json(adaptFestivalData(rows[0]));
        else res.status(404).send("정보 없음");
    } finally { if (connection) connection.end(); }
});

app.listen(port, () => {
    console.log(` 서버 구동 완료: http://localhost:${port}`);
});