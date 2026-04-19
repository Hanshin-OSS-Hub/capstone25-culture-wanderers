import { Link } from 'react-router-dom'

export default function FestivalCard({ festival }) {
    return (
        <Link to={`/detail/${festival.id}`} className="festival-card">
        <div className="festival-thumb" />

        <div className="festival-body">
            <h3 className="festival-title">{festival.title}</h3>

            <div className="festival-meta">
            <span>📅 {festival.period}</span>
            <span>📍 {festival.place}</span>
            </div>

            <div className="festival-tags">
            {festival.badge && <span className="badge">{festival.badge}</span>}
            </div>

            <div className="festival-footer">리뷰 {festival.reviews}</div>
        </div>
        </Link>
    )
}
