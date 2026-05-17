import repo from "../repositories/user.repo.js"

class UsersService {
    async getAllUsers() {
        const users = await repo.getAll()
        return users
    }

    async registerUser() {
        
    }
}

export default new UsersService()