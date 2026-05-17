const repo = require("../repositories/user.repo")

class UsersService {
    async getAllUsers() {
        const users = await repo.getAll()
        return users
    }
    
    async registerUser() {

    }
}

module.exports = new UsersService()