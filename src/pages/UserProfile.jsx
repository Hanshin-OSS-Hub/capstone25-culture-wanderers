import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../api/authFetch";
import "./UserProfile.css";

export default function UserProfile() {
  const { userEmail } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("parties");
  const [parties, setParties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // 파티 모집글 로드
        const partiesData = await authFetch(`/api/users/${userEmail}/parties`);
        setParties(Array.isArray(partiesData) ? partiesData : []);

        // 후기 로드
        const reviewsData = await authFetch(`/api/users/${userEmail}/reviews`);
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);

        // 커뮤니티 게시글 로드
        const postsData = await authFetch(`/api/users/${userEmail}/posts`);
        setPosts(Array.isArray(postsData) ? postsData : []);

        // 유저명 추출 (첫 파티/후기/게시글에서)
        const firstParty = (Array.isArray(partiesData) ? partiesData : [])[0];
        const firstReview = (Array.isArray(reviewsData) ? reviewsData : [])[0];
        const firstPost = (Array.isArray(postsData) ? postsData : [])[0];

        if (firstParty?.authorNickname) {
          setUserName(firstParty.authorNickname);
        } else if (firstReview?.authorNickname) {
          setUserName(firstReview.authorNickname);
        } else if (firstPost?.authorNickname) {
          setUserName(firstPost.authorNickname);
        }
      } catch (error) {
        console.error("유저 정보 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userEmail]);

  const festivalReviews = reviews.filter((r) => r.targetType === "festival");
  const partyReviews = reviews.filter((r) => r.targetType === "party");

  if (loading) {
    return <div className="profile-loading">프로필을 불러오는 중이에요.</div>;
  }

  return (
    <div className="profile-page">
      <button
        type="button"
        className="profile-back-btn"
        onClick={() => navigate(-1)}
      >
        ← 돌아가기
      </button>

      <div className="profile-header">
        <div className="profile-info">
          <h1 className="profile-name">{userName || "사용자"}</h1>
          <p className="profile-email">{userEmail}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          type="button"
          className={`profile-tab ${activeTab === "parties" ? "active" : ""}`}
          onClick={() => setActiveTab("parties")}
        >
          파티 모집글 ({parties.length})
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "festivalReviews" ? "active" : ""}`}
          onClick={() => setActiveTab("festivalReviews")}
        >
          축제 후기 ({festivalReviews.length})
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "partyReviews" ? "active" : ""}`}
          onClick={() => setActiveTab("partyReviews")}
        >
          파티 후기 ({partyReviews.length})
        </button>
        <button
          type="button"
          className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          커뮤니티 글 ({posts.length})
        </button>
      </div>

      <div className="profile-content">
        {activeTab === "parties" && (
          <div className="profile-section">
            {parties.length === 0 ? (
              <p className="profile-empty">작성한 파티 모집글이 없어요.</p>
            ) : (
              <div className="profile-list">
                {parties.map((party) => (
                  <div
                    key={party.id}
                    className="profile-card party-card"
                    onClick={() => navigate(`/party/${party.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-title">{party.title}</div>
                    <div className="profile-card-meta">
                      <span>[축제] {party.festivalTitle || "정보 없음"}</span>
                      <span>[일정] {party.date || "미정"}</span>
                      <span>[장소] {party.location || "미정"}</span>
                    </div>
                    <div className="profile-card-status">
                      {party.status === "모집 중" ? "모집 중" : "모집 마감"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "festivalReviews" && (
          <div className="profile-section">
            {festivalReviews.length === 0 ? (
              <p className="profile-empty">작성한 축제 후기가 없어요.</p>
            ) : (
              <div className="profile-list">
                {festivalReviews.map((review) => (
                  <div
                    key={review.id}
                    className="profile-card review-card"
                    onClick={() => navigate(`/reviews/${review.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-title">{review.title}</div>
                    <div className="profile-card-meta">
                      <span>[대상] {review.targetTitle}</span>
                    </div>
                    <div className="profile-card-rating">
                      {"⭐".repeat(review.rating)}
                    </div>
                    <p className="profile-card-content">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "partyReviews" && (
          <div className="profile-section">
            {partyReviews.length === 0 ? (
              <p className="profile-empty">작성한 파티 후기가 없어요.</p>
            ) : (
              <div className="profile-list">
                {partyReviews.map((review) => (
                  <div
                    key={review.id}
                    className="profile-card review-card"
                    onClick={() => navigate(`/reviews/${review.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-title">{review.title}</div>
                    <div className="profile-card-meta">
                      <span>[파티] {review.targetTitle}</span>
                    </div>
                    <div className="profile-card-rating">
                      {"⭐".repeat(review.rating)}
                    </div>
                    <p className="profile-card-content">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="profile-section">
            {posts.length === 0 ? (
              <p className="profile-empty">작성한 커뮤니티 글이 없어요.</p>
            ) : (
              <div className="profile-list">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="profile-card post-card"
                    onClick={() => navigate(`/community/${post.type.toLowerCase()}/${post.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="profile-card-type">
                      {post.type === "QUESTION"
                        ? "질문"
                        : post.type === "REVIEW"
                        ? "후기"
                        : "자유"}
                    </div>
                    <div className="profile-card-title">{post.title}</div>
                    <div className="profile-card-meta">
                      <span>[조회] {post.viewCount || 0}</span>
                      <span>[댓글] {post.commentCount || 0}</span>
                    </div>
                    <p className="profile-card-content">
                      {post.content.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
