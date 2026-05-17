class UsersRepository {
    async getAll() {
        const usersArray = []
        usersArray.push({
            id: 1,
            name: "Ишанов Сергей Александрович"
        })
        usersArray.push({
            id: 2,
            name: "Кулдышев Никита Андреевич"
        })
        return usersArray
    }
    async create() {
        
    }
}

export default new UsersRepository()