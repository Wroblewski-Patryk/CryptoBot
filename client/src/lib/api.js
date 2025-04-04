import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api", // Twój backend Express
});

export default api;