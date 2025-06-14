import axios from 'axios';

export const getAllLogs = async (page = 1, pageSize = 10) => {
    try {
        const response = await axios.get('http://localhost:8080/api/logs', {
            params: { page, pageSize }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
}

export const getSearchLogs = async (term) => {
    try {
        const response = await axios.get(`http://localhost:8080/api/logs/search/${term}`);
        return response.data;
    } catch (error) {
        console.error("Error searching logs:", error);
        throw error;
    }
}

export const getLogByLevel = async (level) => {
    try {
        const response = await axios.get(`http://localhost:8080/api/logs/level/${level}`);
        console.log(response);

        const data = response.data.map(log => {
            return JSON.parse(atob(log));
        })
        console.log("Parsed logs:", data);
        return response.data;
    } catch (error) {
        console.error("Error fetching logs by level:", error);
        throw error;
    }
}

export const getCustomColors = async () => {
    try {
        const response = await axios.get('http://localhost:8080/api/logs/level/colors');
        return response.data;
    } catch (error) {
        console.error("Error fetching custom colors:", error);
        throw error;
    }
}

export const getLogsByDateRange = async (startDate, endDate, page = 1, pageSize = 10) => {
    try {
        const response = await axios.get('http://localhost:8080/api/logs/by-date', {
            params: {
                startDate,
                endDate,
                page,
                pageSize
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching logs by date:", error);
        throw error;
    }
}

// export const getLogsByDateRange = async (startDate, endDate, page = 1, pageSize = 10) => {
//   const response = await axios.get('/api/logs/by-date', {
//     params: {
//       startDate,
//       endDate,
//       page,
//       pageSize
//     }
//   });
//   return response.data;
// };