const express = require("express")
const db = require("../db")

const router = express.Router()

router.get("/", async (req, res) => {
  let dbStatus = "ok"
  try {
    await db.query("SELECT 1")
  } catch {
    dbStatus = "error"
  }

  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus,
  })
})

module.exports = router