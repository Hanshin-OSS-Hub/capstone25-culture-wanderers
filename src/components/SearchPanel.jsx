import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function SearchPanel() {
    const [region, setRegion] = useState('')
    const [date, setDate] = useState('')
    const [category, setCategory] = useState('')
    const navigate = useNavigate()

    const handleSearch = () => {
        // 일단은 검색 조건만 URL에 붙여서 Result 페이지로 이동
        navigate(
        `/result?region=${encodeURIComponent(region)}&date=${encodeURIComponent(
            date,
        )}&category=${encodeURIComponent(category)}`,
        )
    }

    return (
        <div className="search-panel">
        <select
            className="search-field"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
        >
            <option value="">지역 선택</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
        </select>

        <input
            className="search-field"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
        />

        <select
            className="search-field"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
        >
            <option value="">카테고리</option>
            <option value="축제">축제</option>
            <option value="전시">전시</option>
            <option value="공연">공연</option>
        </select>

        <button className="search-button" onClick={handleSearch}>
            검색
        </button>
        </div>
    )
}
