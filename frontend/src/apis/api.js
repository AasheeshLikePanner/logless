import axios from 'axios';

export const getAllLogs = async () => {
    try {
        const response  = await axios.get('http://localhost:8080/api/logs');
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
}

export const getLogByLevel = async (level) => {
    try {
        const response  = await axios.get(`http://localhost:8080/api/logs/level/${level}`);
        const data = response.data.map(log => {
            JSON.parse(log);
        })
        console.log("Parsed logs:", data);
        return response.data;
    } catch (error) {
        console.error("Error fetching logs by level:", error);
        throw error;
    }
}

export const getSearchLogs = async (searchTerm) => {
    try {
        const response  = await axios.get(`http://localhost:8080/api/logs/search/${searchTerm}`);
       
        return response.data;
    } catch (error) {
        console.error("Error fetching logs by search term:", error);
        throw error;
    }
}