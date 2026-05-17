const { Router } = require("express")
const router = Router()

const usersRouter = require("./users")

router.get("/", (req, res) => res.send({ status: ok }))
router.use("/users", usersRouter)

module.exports = router