import dotenv from "dotenv"
dotenv.config()

export const DATABASE_URL = process.env.DATABASE_URL as string
export const DIRECT_DATABASE_URL = process.env.DIRECT_DATABASE_URL as string