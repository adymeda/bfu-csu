import { Request, Response } from "express"
import service from "../services/user.service"

class UsersControler {
    async getAllUsers(req: Request, res: Response) {
        const users = await service.getAllUsers()
        res.send(users)
    }
    async createUser(req: Request, res: Response) {

    }
}

export default new UsersControler()