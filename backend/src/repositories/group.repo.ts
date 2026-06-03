import pool from "../db"
import type { GroupPublic, GroupDetail, GroupMember, GroupAdmin, CreateGroupDto, UpdateGroupDto, SuggestedRecipient } from "../types/group"

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
        -- Normal case: direct children of root that are in the user's ancestor chain
        SELECT uanc.id FROM user_anc uanc
        JOIN groups g ON g.id = uanc.id
        JOIN root r ON g.parent_id = r.id
        UNION
        -- Root-admin case: if user is member/admin of root itself, all children of root are visible
        SELECT g.id FROM groups g, root r
        WHERE g.parent_id = r.id
          AND EXISTS (SELECT 1 FROM user_anc ua WHERE ua.id = r.id)
    ),
    vis AS (
        SELECT id FROM faculty_root
        UNION ALL
        SELECT g.id FROM groups g JOIN vis ON g.parent_id = vis.id
    )
`

class GroupsRepository {
    async findById(id: number): Promise<GroupDetail | null> {
        const { rows } = await pool.query<GroupDetail>(
            `SELECT g.id, g.name, g.parent_id,
                COALESCE(array_agg(ga.alias) FILTER (WHERE ga.alias IS NOT NULL), '{}') AS aliases
            FROM groups g
            LEFT JOIN group_aliases ga ON ga.group_id = g.id
            WHERE g.id = $1
            GROUP BY g.id`,
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

    async findChildren(groupId: number, userId: number): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `${VISIBILITY_CTE}
            SELECT g.id, g.name, g.parent_id FROM groups g
            WHERE g.parent_id = $2
              AND (g.id IN (SELECT id FROM vis) OR g.id IN (SELECT id FROM root))
            ORDER BY g.name`,
            [userId, groupId]
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
                SELECT * FROM (
                    SELECT DISTINCT ON (u.id) u.id, u.display_name, u.accent_color, gr.position
                    FROM group_members gm
                    JOIN subtree s ON gm.group_id = s.id
                    JOIN users u ON u.id = gm.user_id
                    LEFT JOIN group_roles gr ON gr.group_id = gm.group_id AND gr.user_id = gm.user_id
                    ORDER BY u.id, gr.position NULLS LAST
                ) t
                ORDER BY t.display_name`,
                [groupId]
            )
            return rows
        }
        const { rows } = await pool.query<GroupMember>(
            `SELECT u.id, u.display_name, u.accent_color, gr.position
                FROM group_members gm
                JOIN users u ON u.id = gm.user_id
                LEFT JOIN group_roles gr ON gr.group_id = gm.group_id AND gr.user_id = gm.user_id
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

    async search(_userId: number, q: string): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `WITH RECURSIVE depths AS (
                SELECT id, 0 AS d FROM groups WHERE parent_id IS NULL
                UNION ALL
                SELECT g.id, dp.d + 1 FROM groups g JOIN depths dp ON g.parent_id = dp.id
            )
            SELECT g.id, g.name, g.parent_id
            FROM groups g
            JOIN depths d ON g.id = d.id
            WHERE (g.name ILIKE '%' || $1 || '%'
               OR EXISTS (
                   SELECT 1 FROM group_aliases ga
                   WHERE ga.group_id = g.id AND ga.alias ILIKE '%' || $1 || '%'
               ))
            ORDER BY
                CASE
                    WHEN lower(g.name) = lower($1) THEN 0
                    WHEN lower(g.name) ILIKE lower($1) || '%' THEN 1
                    ELSE 2
                END,
                d.d,
                g.name
            LIMIT 20`,
            [q]
        )
        return rows
    }

    async findRoots(userId: number): Promise<GroupPublic[]> {
        const { rows } = await pool.query<GroupPublic>(
            `${VISIBILITY_CTE}
            SELECT g.id, g.name, g.parent_id
            FROM groups g
            WHERE g.parent_id IS NULL
                AND (g.id IN (SELECT id FROM vis) OR g.id IN (SELECT id FROM root))
            ORDER BY g.name`,
            [userId]
        )
        return rows
    }

    async suggested(userId: number): Promise<SuggestedRecipient[]> {
        const { rows } = await pool.query<SuggestedRecipient>(
            `WITH RECURSIVE
            user_scope AS (
                SELECT group_id AS id FROM group_members WHERE user_id = $1
                UNION
                SELECT group_id AS id FROM group_admins WHERE user_id = $1
            ),
            ancestors AS (
                SELECT g.parent_id AS id, 1 AS dist
                FROM groups g
                WHERE g.id IN (SELECT id FROM user_scope) AND g.parent_id IS NOT NULL
                UNION ALL
                SELECT g.parent_id, a.dist + 1
                FROM groups g JOIN ancestors a ON g.id = a.id
                WHERE g.parent_id IS NOT NULL
            ),
            ancestor_tier AS (
                SELECT id, MIN(dist) AS dist FROM ancestors GROUP BY id
            ),
            parents AS (
                SELECT DISTINCT g.parent_id AS id
                FROM groups g
                WHERE g.id IN (SELECT id FROM user_scope) AND g.parent_id IS NOT NULL
            ),
            siblings AS (
                SELECT g.id FROM groups g
                WHERE g.parent_id IN (SELECT id FROM parents)
                  AND g.id NOT IN (SELECT id FROM user_scope)
            ),
            tiers AS (
                SELECT id, CASE WHEN dist = 1 THEN 1 ELSE dist + 1 END AS tier FROM ancestor_tier
                UNION ALL SELECT id, 2 FROM siblings
                UNION ALL SELECT id, 1000000 FROM user_scope
            ),
            group_tier AS (
                SELECT id, MIN(tier) AS tier FROM tiers GROUP BY id
            )
            SELECT type, id, name, accent_color FROM (
                SELECT 1 AS type, g.id, g.name, NULL::varchar AS accent_color, gt.tier, 0 AS is_user
                FROM groups g JOIN group_tier gt ON g.id = gt.id
                UNION ALL
                SELECT 0 AS type, u.id, u.display_name AS name, u.accent_color, MIN(gt.tier) AS tier, 1 AS is_user
                FROM group_members gm
                JOIN group_tier gt ON gm.group_id = gt.id
                JOIN users u ON u.id = gm.user_id
                WHERE u.id <> $1
                GROUP BY u.id, u.display_name, u.accent_color
            ) rows
            ORDER BY tier, is_user, name
            LIMIT 50`,
            [userId]
        )
        return rows
    }

    async addAlias(groupId: number, alias: string): Promise<void> {
        await pool.query(
            `INSERT INTO group_aliases (group_id, alias) VALUES ($1, $2)`,
            [groupId, alias]
        )
    }

    async removeAlias(groupId: number, alias: string): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM group_aliases WHERE group_id = $1 AND alias = $2`,
            [groupId, alias]
        )
        return (rowCount ?? 0) > 0
    }

    async resolveByName(name: string): Promise<number | null> {
        const { rows } = await pool.query<{ id: number }>(
            `WITH RECURSIVE depths AS (
                SELECT id, 0 AS d FROM groups WHERE parent_id IS NULL
                UNION ALL
                SELECT g.id, dp.d + 1 FROM groups g JOIN depths dp ON g.parent_id = dp.id
            )
            SELECT g.id FROM groups g
            JOIN depths d ON g.id = d.id
            WHERE lower(g.name) = lower($1)
               OR lower(g.name) LIKE lower($1) || ' %'
               OR EXISTS (
                   SELECT 1 FROM group_aliases ga
                   WHERE ga.group_id = g.id
                     AND (lower(ga.alias) = lower($1) OR lower(ga.alias) LIKE lower($1) || ' %')
               )
            ORDER BY
                CASE WHEN lower(g.name) = lower($1) THEN 0 ELSE 1 END,
                d.d
            LIMIT 1`,
            [name]
        )
        return rows[0]?.id ?? null
    }

    async resolveByPath(parent: string, child: string): Promise<number | null> {
        const { rows } = await pool.query<{ id: number }>(
            `WITH RECURSIVE ancestors AS (
                SELECT g.id, g.parent_id, 0 AS dist
                FROM groups g
                WHERE lower(g.name) = lower($2)
                   OR EXISTS (
                       SELECT 1 FROM group_aliases ga
                       WHERE ga.group_id = g.id AND lower(ga.alias) = lower($2)
                   )
                UNION ALL
                SELECT g.id, g.parent_id, a.dist + 1
                FROM groups g JOIN ancestors a ON g.parent_id = a.id
                WHERE a.id != g.id
            ),
            candidates AS (
                SELECT a.id,
                    (SELECT MIN(dist) FROM ancestors anc
                     WHERE anc.id = a.id) AS child_dist,
                    MIN(CASE
                        WHEN lower(p.name) = lower($1) OR EXISTS (
                            SELECT 1 FROM group_aliases ga
                            WHERE ga.group_id = p.id AND lower(ga.alias) = lower($1)
                        ) THEN 1 ELSE NULL
                    END) AS has_parent
                FROM ancestors a
                JOIN groups p ON p.id = a.parent_id
                GROUP BY a.id
            )
            SELECT id FROM candidates
            WHERE has_parent = 1
            ORDER BY child_dist
            LIMIT 1`,
            [parent, child]
        )
        return rows[0]?.id ?? null
    }

    async findUserByPosition(groupId: number, position: string): Promise<number | null> {
        const { rows } = await pool.query<{ user_id: number }>(
            `SELECT user_id FROM group_roles
            WHERE group_id = $1 AND lower(position) = lower($2)
            LIMIT 1`,
            [groupId, position]
        )
        return rows[0]?.user_id ?? null
    }

    async setRole(groupId: number, userId: number, position: string): Promise<void> {
        await pool.query(
            `INSERT INTO group_roles (group_id, user_id, position) VALUES ($1, $2, $3)
            ON CONFLICT (group_id, user_id) DO UPDATE SET position = EXCLUDED.position`,
            [groupId, userId, position]
        )
    }

    async removeRole(groupId: number, userId: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM group_roles WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        )
        return (rowCount ?? 0) > 0
    }
}

export default new GroupsRepository()