import axios from "axios";

/**
 * Same-origin client. The observatory reads from Next.js route handlers under
 * `/api/*`, which currently serve fixture data and will later proxy Supabase.
 * Override with NEXT_PUBLIC_API_BASE_URL if the API is hosted elsewhere.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api",
  timeout: 20000,
});
