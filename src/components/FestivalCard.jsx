import { Link } from 'react-router-dom';

export default function FestivalCard({ festival }) {
  const thumbnail = festival.thumbnail_url || festival.thumbnailUrl || '';
  const reviewCount = festival.reviews ?? festival.review_count ?? festival.reviewCount ?? 0;
  const likeCount = festival.like_count ?? festival.likeCount ?? 0;
  const viewCount = festival.view_count ?? festival.viewCount ?? 0;

  return (
    <Link to={`/detail/${festival.id}`} className="festival-card">
      <div
        className="festival-thumb"
        style={{
          backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="festival-body">
        <h3 className="festival-title">{festival.title}</h3>

        <div className="festival-meta">
          <span>{festival.period}</span>
          <span>{festival.place}</span>
        </div>

        {festival.badge ? (
          <div className="festival-tags">
            <span className="badge">{festival.badge}</span>
          </div>
        ) : null}

        <div className="festival-footer">
          <span>조회 {viewCount}</span>
          <span>좋아요 {likeCount}</span>
          <span>리뷰 {reviewCount}</span>
        </div>
      </div>
    </Link>
  );
}
