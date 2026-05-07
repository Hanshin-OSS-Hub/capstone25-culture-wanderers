import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// DB 설정
const dbConfig = {
    host: 'localhost',
    user: 'appuser',
    password: '1234',
    database: 'culture_wanderers'
};

// 프론트엔드와 데이터 변수를 맞춰주는 함수
const adaptFestivalData = (data) => {
    if (!data) return null;

    return {
        ...data,
        tel: data.tel || "정보 없음",
        price: data.price || "무료 (상세 확인)",
        description: data.description || "상세 정보 준비 중입니다.",
        homepage_url: data.homepage_url || ""
    };
};

// 1. 축제 전체 리스트
app.get('/api/festivals', async (req, res) => {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM festivals ORDER BY start_date ASC'
        );

        res.json(rows.map(row => adaptFestivalData(row)));
    } catch (error) {
        console.error("축제 전체 조회 에러:", error);
        res.status(500).send("DB 조회 실패");
    } finally {
        if (connection) await connection.end();
    }
});

// 2. 축제 검색 및 필터 API
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

        // 지역 필터 (약어 대응)
        if (region && region !== '전체') {
            const regionMap = {
                '경남': '경상남도',
                '경북': '경상북도',
                '전남': '전라남도',
                '전북': '전라북도',
                '충남': '충청남도',
                '충북': '충청북도',
                '강원': '강원도',
                '경기': '경기도',
                '제주': '제주'
            };

            if (regionMap[region]) {
                sql += ` AND (region LIKE ? OR region LIKE ?)`;
                params.push(`%${region}%`, `%${regionMap[region]}%`);
            } else {
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
            sql += ` AND start_date <= ? AND end_date >= ?`;
            params.push(date.replaceAll('-', ''), date.replaceAll('-', ''));
        }

        // 무료 필터
        if (free === '1') {
            sql += ` AND (price IS NULL OR price = '' OR price LIKE '%무료%')`;
        }

        // 가격 상한
        // 현재 price 컬럼이 text라 숫자 비교는 정확하지 않아서 일단 보수적으로 유지
        // 숫자형 가격만 따로 저장하지 않는 이상 정밀 필터는 어려움
        if (maxPrice && !isNaN(Number(maxPrice))) {
            // text 컬럼 구조상 명확한 숫자 비교 어려워서 여기서는 필터 적용 안 함
            // 필요하면 추후 price_numeric 컬럼 추가 추천
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
        if (connection) await connection.end();
    }
});

// 3. 상세 페이지 API
app.get('/api/festivals/:id', async (req, res) => {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(
            'SELECT * FROM festivals WHERE id = ?',
            [req.params.id]
        );

        if (rows.length > 0) {
            res.json(adaptFestivalData(rows[0]));
        } else {
            res.status(404).send("정보 없음");
        }
    } catch (error) {
        console.error("상세 조회 에러:", error);
        res.status(500).send("상세 조회 실패");
    } finally {
        if (connection) await connection.end();
    }
});

// 4. 홈페이지 URL 없는 축제 조회
app.get('/api/admin/festivals/missing-homepage', async (req, res) => {
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query(`
            SELECT *
            FROM festivals
            WHERE homepage_url IS NULL OR homepage_url = ''
            ORDER BY start_date ASC
        `);

        res.json(rows.map(row => adaptFestivalData(row)));
    } catch (error) {
        console.error("홈페이지 누락 축제 조회 에러:", error);
        res.status(500).send("홈페이지 누락 축제 조회 실패");
    } finally {
        if (connection) await connection.end();
    }
});

// 5. 홈페이지 URL 수동 저장
app.put('/api/admin/festivals/:id/homepage', async (req, res) => {
    let connection;

    try {
        const { homepage_url } = req.body;
        const festivalId = req.params.id;

        connection = await mysql.createConnection(dbConfig);

        await connection.query(
            `UPDATE festivals
             SET homepage_url = ?
             WHERE id = ?`,
            [homepage_url || '', festivalId]
        );

        const [rows] = await connection.query(
            'SELECT * FROM festivals WHERE id = ?',
            [festivalId]
        );

        if (rows.length === 0) {
            return res.status(404).send("축제 정보를 찾을 수 없음");
        }

        res.json(adaptFestivalData(rows[0]));
    } catch (error) {
        console.error("홈페이지 URL 저장 에러:", error);
        res.status(500).send("홈페이지 URL 저장 실패");
    } finally {
        if (connection) await connection.end();
    }
});

app.listen(port, () => {
    console.log(`서버 구동 완료: http://localhost:${port}`);
});