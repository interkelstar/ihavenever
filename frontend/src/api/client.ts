import axios from 'axios';

// Create the axios instance
export const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Define types if needed, but for now we'll use 'any' or explicit types in components to save time unless strictness is required.
// Actually, let's just make the functions wrapper to call the api.

// Home
export const createRoom = async () => {
    const response = await api.post('/room');
    // The backend returns RoomDto { code: number } directly? Or wrapped?
    // Based on RoomRestController: fun createRoom(): ResponseEntity<RoomDto>
    // So response.data is RoomDto.
    return response.data;
};

export const checkRoomExists = async (code: number) => {
    try {
        await api.get(`/room/${code}`);
        return true;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        throw error;
    }
};

// Room
export const postQuestion = async (code: number, data: { question: string }) => {
    return api.post(`/room/${code}/questions`, data);
};

// Host
export const loadQuestions = async (code: number, params: { size: number, datasetName: string }) => {
    const response = await api.post(`/room/${code}/load`, params);
    return response.data; // Returns count (Int)
};

export const uploadQuestions = async (code: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/room/${code}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data; // Returns string message or count? Controller returns String "Uploaded X questions"
};

// Game
export const getRandomQuestion = async (code: number) => {
    try {
        const response = await api.get(`/room/${code}/questions/random`);
        if (response.status === 204) return null;
        return response.data; // QuestionDto { question: string }
    } catch (error: any) {
        if (error.response && error.response.status === 204) return null;
        throw error;
    }
};

export const getNotShownCount = async (code: number) => {
    const response = await api.get(`/room/${code}/notShownCount`);
    return response.data; // Long/Int
};

export const downloadQuestions = async (code: number) => {
    const response = await api.get(`/room/${code}/questions/download`, {
        responseType: 'blob' // Important for file download
    });
    return response.data; // Blob or text
};
