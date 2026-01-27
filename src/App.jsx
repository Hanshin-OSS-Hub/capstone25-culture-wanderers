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
import MyPage from "./pages/MyPage";
import Benefits from "./pages/Benefits";
import PartyDetail from "./pages/PartyDetail";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* ✅ 기존 검색 페이지 */}
        <Route path="/search" element={<Search />} />

        {/* ✅ 추가: /result도 Search 페이지로 열리게(결과 페이지로 재사용) */}
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
        <Route path="/mypage" element={<MyPage />} />
      </Routes>
    </Layout>
  );
}
