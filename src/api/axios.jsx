import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const backed_api =  axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // This ensures cookies are sent with requests
});

export default backed_api;