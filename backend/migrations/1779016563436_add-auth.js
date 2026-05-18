/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
	pgm.createTable('sessions', {
		token: {
			type: 'char(64)',
			primaryKey: true,
		},
		user_id: {
			type: 'integer',
			notNull: true,
			references: '"users"(id)',
			onDelete: 'CASCADE',
		},
		expires_at: {
			type: 'timestamptz',
			notNull: true,
		},
		created_at: {
			type: 'timestamptz',
			notNull: true,
			default: pgm.func('now()'),
		},
	})

	pgm.createIndex('sessions', 'user_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('sessions')
}
