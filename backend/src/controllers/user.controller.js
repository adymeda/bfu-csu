const service = require("../services/user.service")

class UsersControler {
    async getAllUsers(req, res) {
        const users = await service.getAllUsers()
        res.send(users)
    }
    async createUser(req, res) {

    }
}

module.exports = new UsersControler()