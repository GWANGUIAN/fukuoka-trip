import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { PullToRefresh } from './components/PullToRefresh';
import { Home } from './pages/Home';
import { Schedule } from './pages/Schedule';
import { MapPage } from './pages/MapPage';
import { Checklist } from './pages/Checklist';
import { Info } from './pages/Info';
import { Together } from './pages/Together';

export default function App() {
  return (
    <HashRouter>
      <PullToRefresh />
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/together" element={<Together />} />
          <Route path="/info" element={<Info />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </HashRouter>
  );
}
