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

function App() {
    return (
        <BrowserRouter basename={basename}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room/:code" element={<Room />} />
                <Route path="/room/:code/host" element={<Host />} />
                <Route path="/room/:code/game" element={<Game />} />
                <Route path="/404" element={<RoomNotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
