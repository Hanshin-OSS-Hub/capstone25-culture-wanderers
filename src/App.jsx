import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Search from "./pages/Search";
import Detail from "./pages/Detail";
import PartyList from "./pages/PartyList";
import PartyWrite from "./pages/PartyWrite";
import Community from "./pages/Community";
import CommunityWrite from "./pages/CommunityWrite";
import CommunityDetail from "./pages/CommunityDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyPageLayout from "./pages/MyPage/MyPageLayout";
import MyPageHome from "./pages/MyPage/MyPageHome";
import MyInfoEdit from "./pages/MyPage/MyInfoEdit";
import LikeList from "./pages/MyPage/LikeList";
import CalendarPage from "./pages/MyPage/CalendarPage";
import PartyHistory from "./pages/MyPage/PartyHistory";
import Withdraw from "./pages/MyPage/Withdraw";
import MyReviews from "./pages/MyPage/MyReviews";
import ReviewWrite from "./pages/MyPage/ReviewWrite";
import ReviewEdit from "./pages/MyPage/ReviewEdit";
import MyPartyPosts from "./pages/MyPage/MyPartyPosts";


import Benefits from "./pages/Benefits";
import PartyDetail from "./pages/PartyDetail";

import RequireAuth from "./auth/RequireAuth"; //2026.02.02 추가

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/result" element={<Search />} />

        <Route path="/detail/:id" element={<Detail />} />
        <Route path="/party" element={<PartyList />} />
        <Route path="/party/write" element={<PartyWrite />} />
        <Route path="/party/:id" element={<PartyDetail />} />
        <Route path="/community" element={<Community />} />
        <Route path="/community/write/:type" element={<CommunityWrite />} />
        <Route path="/community/:type/:id" element={<CommunityDetail />} />
        <Route path="/benefits" element={<Benefits />} />

        <Route path="/login" element={<Login />} />

        {/* 2026.02.02 */}
        <Route
          path="/mypage"
          element={
            <RequireAuth>
              <MyPageLayout />
            </RequireAuth>
          }
        >
          <Route index element={<MyPageHome />} />
          <Route path="info" element={<MyInfoEdit />} />
          <Route path="likes" element={<LikeList />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="parties" element={<PartyHistory />} />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="reviews/new" element={<ReviewWrite />} />
          <Route path="reviews/:id/edit" element={<ReviewEdit />} />
          <Route path="posts" element={<MyPartyPosts />} />

        </Route>

        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Layout>
  );
}
