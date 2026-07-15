import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Host from './pages/Host';
import Game from './pages/Game';
import AdminStats from './pages/AdminStats';
import RoomNotFound from './pages/RoomNotFound';
import './index.css';

// Use / for both dev and prod
const basename = '/';

import Footer from './components/Footer';
import { LanguageProvider } from './i18n';
import BuyMeACoffeeWidget from './components/BuyMeACoffeeWidget';

function AppContent() {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <div className="flex flex-col min-h-[100dvh] w-full">
            <main className="flex-grow flex flex-col items-center justify-center w-full px-5 py-10">
                <div className={`w-full ${isAdmin ? 'max-w-[1200px]' : 'max-w-[562px]'} transition-all duration-300`}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/room/:code" element={<Room />} />
                        <Route path="/room/:code/host" element={<Host />} />
                        <Route path="/room/:code/game" element={<Game />} />
                        <Route path="/admin/stats" element={<AdminStats />} />
                        <Route path="/404" element={<RoomNotFound />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <LanguageProvider>
            <BrowserRouter basename={basename}>
                <AppContent />
            </BrowserRouter>
            <BuyMeACoffeeWidget />
        </LanguageProvider>
    );
}

export default App;
