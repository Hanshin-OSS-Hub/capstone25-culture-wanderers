import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Project2025!', // 본인 비번 확인
    database: 'culture_wanderers'
};

async function fixDB() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("🛠️ [수리] DB 접속 성공. 수리 시작합니다...");

        // 1. 보안 장치(외래키) 잠시 끄기 (이거 때문에 에러 났었음)
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 2. 가격(price) 칸을 무조건 '글자(VARCHAR)'로 변경
        try {
            await connection.query('ALTER TABLE festivals MODIFY price VARCHAR(255) NULL');
            console.log("✅ 가격(price) 칸, 글자형으로 변경 완료.");
        } catch (e) { console.log("⚠️ 가격 칸 변경 패스 (이미 됨/오류)"); }

        // 3. 전화번호(tel) 칸 추가
        try {
            await connection.query('ALTER TABLE festivals ADD COLUMN tel VARCHAR(100) NULL');
            console.log("✅ 전화번호(tel) 칸 추가 완료.");
        } catch (e) { console.log("⚠️ 전화번호 칸 이미 있음."); }

        // 4. 설명(description) 칸 늘리기
        try {
            await connection.query('ALTER TABLE festivals MODIFY description LONGTEXT');
            console.log("✅ 설명(description) 칸 확장 완료.");
        } catch (e) { console.log("⚠️ 설명 칸 변경 패스."); }

        // 5. 내용물 비우기 (깨끗하게 시작)
        await connection.query('TRUNCATE TABLE festivals');
        console.log("🧹 기존 데이터 깨끗하게 비웠습니다.");

        // 6. 보안 장치 다시 켜기
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("\n🎉 [수리 끝] 이제 fetchData.js 실행하면 됩니다!");

    } catch (error) {
        console.error("❌ 에러:", error.message);
    } finally {
        if (connection) connection.end();
    }
}

fixDB();