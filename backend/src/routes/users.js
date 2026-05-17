const { Router } = require("express")
const router = Router()

const controller = require("../controllers/user.controller")

router.get("/", controller.getAllUsers)
router.post("/create", controller.createUser)

module.exports = router