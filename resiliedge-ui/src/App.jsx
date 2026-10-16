import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Overview from './pages/Overview.jsx';
import PumpDetail from './pages/PumpDetail.jsx';
import BurstTest from './pages/BurstTest.jsx';
import Timeline from './pages/Timeline.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="app-layout">
          <Header />
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/pump/:id" element={<PumpDetail />} />
            <Route path="/burst" element={<BurstTest />} />
            <Route path="/timeline" element={<Timeline />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
