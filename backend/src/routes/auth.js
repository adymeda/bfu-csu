const express = require("express")
const bcrypt = require("bcryptjs")
const db = require("../db")

const router = express.Router()

router.post("/register", async (req, res) => {
  res.status(501).json({ message: "Not implemented" })
})

router.post("/login", async (req, res) => {
  res.status(501).json({ message: "Not implemented" })
})

router.post("/logout", async (req, res) => {
  res.status(501).json({ message: "Not implemented" })
})

module.exports = router
