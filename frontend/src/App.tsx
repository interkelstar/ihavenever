import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import Host from './pages/Host';
import Game from './pages/Game';
import RoomNotFound from './pages/RoomNotFound';
import './index.css';

// Use /v2-static for Vite dev server, and /v2 for Spring Boot production
const basename = import.meta.env.DEV ? '/v2-static' : '/v2';

import Footer from './components/Footer';

function App() {
    return (
        <BrowserRouter basename={basename}>
            <div className="flex flex-col min-h-[100dvh] w-full">
                <main className="flex-grow flex flex-col items-center justify-center w-full px-5 py-10">
                    <div className="w-full max-w-[562px]">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/room/:code" element={<Room />} />
                            <Route path="/room/:code/host" element={<Host />} />
                            <Route path="/room/:code/game" element={<Game />} />
                            <Route path="/404" element={<RoomNotFound />} />
                        </Routes>
                    </div>
                </main>
                <Footer />
            </div>
        </BrowserRouter>
    );
}

export default App;
