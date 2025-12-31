import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const RoomNotFound: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card text-center"
        >
            <h1>Такой комнаты <i>ещё</i> нет...</h1>

            <div className="mb-4">
                <h2>... или <i>уже</i></h2>
                <p>Ведь комната автоматически удалится если за последние сутки не было задано ни одного вопроса.</p>
                <p>Но ты всегда можешь создать новую просто перейдя</p>
            </div>

            <Link to="/" className="modern-btn btn-primary" style={{ textDecoration: 'none', display: 'block' }}>
                На главную страницу
            </Link>
        </motion.div>
    );
};

export default RoomNotFound;
