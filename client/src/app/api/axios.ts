import axios from "axios";

export const api = axios.create({
  baseURL: process.env.SERVER_URL!,
  headers: {
    "Authorization": `Bearer ${process.env.AUTH_TOKEN}`,
  },
});
