import pool from "../db"
import type { GroupPublic, GroupMember, GroupAdmin, CreateGroupDto, UpdateGroupDto } from "../types/group"

const VISIBILITY_CTE = `
    WITH RECURSIVE
    user_scope AS (
        SELECT group_id AS id FROM group_members WHERE user_id = $1
        UNION
        SELECT group_id AS id FROM group_admins WHERE user_id = $1
    ),
    user_anc AS (
        SELECT g.id, g.parent_id FROM groups g WHERE g.id IN (SELECT id FROM user_scope)
        UNION ALL
        SELECT g.id, g.parent_id FROM groups g JOIN user_anc uanc ON g.id = uanc.parent_id
    ),
    root AS (SELECT id FROM groups WHERE parent_id IS NULL LIMIT 1),
    faculty_root AS (
        SELECT uanc.id FROM user_anc uanc
        JOIN groups g ON g.id = uanc.id
        JOIN root r ON g.parent_id = r.id
    ),
    vis AS (
        SELECT id FROM faculty_root
        UNION ALL
        SELECT g.id FROM groups g JOIN vis ON g.parent_id = vis.id
    )
`

class GroupsRepository {
    async findById(id: number): Promise<GroupPublic | null> {
        const { rows } = await pool.query<GroupPublic>(
            `SELECT id, name, parent_id FROM groups WHERE id = $1`,
            [id]
        )
        return rows[0] ?? null
    }

    async create(dto: CreateGroupDto): Promise<GroupPublic> {
        const { rows } = await pool.query<GroupPublic>(
            `INSERT INTO groups (name, parent_id)
                VALUES ($1, $2)
                RETURNING id, name, parent_id`,
            [dto.name, dto.parent_id ?? null]
        )
        return rows[0]!
    }

    async update(id: number, data: UpdateGroupDto): Promise<GroupPublic | null> {
        const entries = Object.entries(data) as [string, unknown][]
        const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ')
        const values = entries.map(([, val]) => val)
        const { rows } = await pool.query<GroupPublic>(
            `UPDATE groups SET ${set} WHERE id = $1
                RETURNING id, name, parent_id`,
            [id, ...values]
        )
        return rows[0] ?? null
    }

    async delete(id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM groups WHERE id = $1`,
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    async findChildren(groupId: number): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `SELECT id, name, parent_id FROM groups
                WHERE parent_id = $1
                ORDER BY name`,
            [groupId]
        )
        return rows
    }

    async findAncestors(groupId: number): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `WITH RECURSIVE ancestors AS (
                SELECT id, name, parent_id, 0 AS ord FROM groups WHERE id = $1
                UNION ALL
                SELECT g.id, g.name, g.parent_id, a.ord + 1
                FROM groups g JOIN ancestors a ON g.id = a.parent_id
            )
            SELECT id, name, parent_id FROM ancestors ORDER BY ord DESC`,
            [groupId]
        )
        return rows
    }

    async isVisible(userId: number, groupId: number): Promise<boolean> {
        const { rows } = await pool.query<{ visible: boolean }>(
            `${VISIBILITY_CTE}
            SELECT EXISTS (
                SELECT 1 FROM vis WHERE id = $2
                UNION ALL
                SELECT 1 FROM root WHERE id = $2
            ) AS visible`,
            [userId, groupId]
        )
        return rows[0]?.visible ?? false
    }

    async isAdminOfOrAncestor(userId: number, groupId: number): Promise<boolean> {
        const { rows } = await pool.query<{ is_admin: boolean }>(
            `WITH RECURSIVE ancestors AS (
                SELECT id, parent_id FROM groups WHERE id = $2
                UNION ALL
                SELECT g.id, g.parent_id FROM groups g JOIN ancestors a ON g.id = a.parent_id
            )
            SELECT EXISTS (
                SELECT 1 FROM group_admins ga
                WHERE ga.user_id = $1
                    AND ga.group_id IN (SELECT id FROM ancestors)
            ) AS is_admin`,
            [userId, groupId]
        )
        return rows[0]?.is_admin ?? false
    }

    async isSuperAdminOfOrAncestor(userId: number, groupId: number): Promise<boolean> {
        const { rows } = await pool.query<{ is_super_admin: boolean }>(
            `WITH RECURSIVE ancestors AS (
                SELECT id, parent_id FROM groups WHERE id = $2
                UNION ALL
                SELECT g.id, g.parent_id FROM groups g JOIN ancestors a ON g.id = a.parent_id
            )
            SELECT EXISTS (
                SELECT 1 FROM group_admins ga
                WHERE ga.user_id = $1
                    AND ga.is_super = true
                    AND ga.group_id IN (SELECT id FROM ancestors)
            ) AS is_super_admin`,
            [userId, groupId]
        )
        return rows[0]?.is_super_admin ?? false
    }

    async findMembers(groupId: number, deep: boolean): Promise<GroupMember[]> {
        if(deep) {
            const { rows } = await pool.query<GroupMember>(
                `WITH RECURSIVE subtree AS (
                    SELECT id FROM groups WHERE id = $1
                    UNION ALL
                    SELECT g.id FROM groups g JOIN subtree s ON g.parent_id = s.id
                )
                SELECT DISTINCT u.id, u.display_name, u.accent_color
                FROM group_members gm
                JOIN subtree s ON gm.group_id = s.id
                JOIN users u ON u.id = gm.user_id
                ORDER BY u.display_name`,
                [groupId]
            )
            return rows
        }
        const { rows } = await pool.query<GroupMember>(
            `SELECT u.id, u.display_name, u.accent_color
                FROM group_members gm
                JOIN users u ON u.id = gm.user_id
                WHERE gm.group_id = $1
                ORDER BY u.display_name`,
            [groupId]
        )
        return rows
    }

    async addMember(groupId: number, userId: number): Promise<void> {
        await pool.query(
            `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)`,
            [groupId, userId]
        )
    }

    async removeMember(groupId: number, userId: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        )
        return (rowCount ?? 0) > 0
    }

    async findAdmins(groupId: number): Promise<GroupAdmin[]> {
        const { rows } = await pool.query<GroupAdmin>(
            `SELECT ga.user_id, ga.is_super, u.display_name, u.accent_color
                FROM group_admins ga
                JOIN users u ON u.id = ga.user_id
                WHERE ga.group_id = $1
                ORDER BY ga.is_super DESC, u.display_name`,
            [groupId]
        )
        return rows
    }

    async addAdmin(groupId: number, userId: number, isSuper: boolean): Promise<void> {
        await pool.query(
            `INSERT INTO group_admins (group_id, user_id, is_super) VALUES ($1, $2, $3)`,
            [groupId, userId, isSuper]
        )
    }

    async removeAdmin(groupId: number, userId: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM group_admins WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        )
        return (rowCount ?? 0) > 0
    }

    async canAssign(authorId: number, assigneeId: number): Promise<boolean> {
        const { rows } = await pool.query<{ allowed: boolean }>(
            `WITH RECURSIVE author_scope AS (
                SELECT group_id AS id FROM group_members WHERE user_id = $1
                UNION
                SELECT group_id AS id FROM group_admins WHERE user_id = $1
            ),
            subtree AS (
                SELECT id FROM author_scope
                UNION
                SELECT g.id FROM groups g JOIN subtree s ON g.parent_id = s.id
            ),
            assignee_scope AS (
                SELECT group_id AS id FROM group_members WHERE user_id = $2
                UNION
                SELECT group_id AS id FROM group_admins WHERE user_id = $2
            )
            SELECT EXISTS (
                SELECT 1 FROM assignee_scope a
                JOIN subtree s ON a.id = s.id
            ) AS allowed`,
            [authorId, assigneeId]
        )
        return rows[0]?.allowed ?? false
    }

    async search(userId: number, q: string): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `${VISIBILITY_CTE},
            depths AS (
                SELECT id, 0 AS d FROM groups WHERE parent_id IS NULL
                UNION ALL
                SELECT g.id, dp.d + 1 FROM groups g JOIN depths dp ON g.parent_id = dp.id
            )
            SELECT g.id, g.name, g.parent_id
            FROM groups g
            JOIN depths d ON g.id = d.id
            WHERE (g.id IN (SELECT id FROM vis) OR g.id IN (SELECT id FROM root))
                AND g.name ILIKE '%' || $2 || '%'
            ORDER BY
                CASE
                    WHEN lower(g.name) = lower($2) THEN 0
                    WHEN lower(g.name) ILIKE lower($2) || '%' THEN 1
                    ELSE 2
                END,
                CASE WHEN g.id IN (SELECT id FROM user_anc) THEN 0 ELSE 1 END,
                CASE WHEN g.parent_id IN (
                    SELECT ug.parent_id FROM groups ug
                    WHERE ug.id IN (SELECT id FROM user_scope)
                ) THEN 0 ELSE 1 END,
                d.d,
                g.name`,
            [userId, q]
        )
        return rows
    }

    async suggested(userId: number): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `${VISIBILITY_CTE},
            depths AS (
                SELECT id, 0 AS d FROM groups WHERE parent_id IS NULL
                UNION ALL
                SELECT g.id, dp.d + 1 FROM groups g JOIN depths dp ON g.parent_id = dp.id
            )
            SELECT g.id, g.name, g.parent_id
            FROM groups g
            JOIN depths d ON g.id = d.id
            WHERE (g.id IN (SELECT id FROM vis) OR g.id IN (SELECT id FROM root))
                AND g.id NOT IN (SELECT id FROM user_scope)
            ORDER BY
                CASE WHEN g.id IN (SELECT id FROM user_anc) THEN 0 ELSE 1 END,
                d.d,
                g.name
            LIMIT 20`,
            [userId]
        )
        return rows
    }
}

export default new GroupsRepository()