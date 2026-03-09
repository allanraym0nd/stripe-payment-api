import postgres from "postgres";
import dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10
})

export default sql;