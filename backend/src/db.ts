import { Pool, types } from "pg"

types.setTypeParser(20, (v: string) => parseInt(v, 10))

const ENV_PORT = process.env.DB_PORT

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: ENV_PORT ? parseInt(ENV_PORT) : 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
})

pool.on("error", (err) => {
    console.error("PostgreSQL error:", err)
})

export default pool