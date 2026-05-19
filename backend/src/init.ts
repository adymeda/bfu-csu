import bcrypt from "bcryptjs"
import pool from "./db"

export async function initAdmin(): Promise<void> {
	const email = process.env.ADMIN_EMAIL
	const password = process.env.ADMIN_PASSWORD

	if (!email || !password) {
		console.log("ADMIN_EMAIL or ADMIN_PASSWORD not set, skipping admin init")
		return
	}

	let { rows: [rootGroup] } = await pool.query<{ id: number }>(
		`SELECT id FROM groups WHERE parent_id IS NULL LIMIT 1`
	)

	if (!rootGroup) {
		const { rows: [created] } = await pool.query<{ id: number }>(
			`INSERT INTO groups (name, parent_id) VALUES ('Университет', NULL) RETURNING id`
		)
		rootGroup = created!
		console.log(`Root group created (id=${rootGroup.id})`)
	}

	const { rows: [existing] } = await pool.query<{ id: number }>(
		`SELECT id FROM users WHERE email = $1`,
		[email]
	)

	let userId: number

	if (existing) {
		userId = existing.id
		console.log(`Admin user already exists (id=${userId})`)
	} else {
		const passwordHash = await bcrypt.hash(password, 10)
		const { rows: [user] } = await pool.query<{ id: number }>(
			`INSERT INTO users (email, password, display_name)
				VALUES ($1, $2, 'Admin')
				RETURNING id`,
			[email, passwordHash]
		)
		userId = user!.id
		console.log(`Admin user created (id=${userId})`)
	}

	await pool.query(
		`INSERT INTO group_admins (group_id, user_id, is_super)
			VALUES ($1, $2, true)
			ON CONFLICT (group_id, user_id) DO UPDATE SET is_super = true`,
		[rootGroup.id, userId]
	)

	console.log(`Admin user is super admin of root group (group_id=${rootGroup.id})`)
}