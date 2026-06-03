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
	pgm.createTable('group_roles', {
		group_id: {
			type: 'integer',
			notNull: true,
			references: '"groups"(id)',
			onDelete: 'CASCADE',
		},
		user_id: {
			type: 'integer',
			notNull: true,
			references: '"users"(id)',
			onDelete: 'CASCADE',
		},
		position: {
			type: 'varchar(255)',
			notNull: true,
		},
	}, {
		constraints: {
			primaryKey: ['group_id', 'user_id'],
		},
	})

	pgm.createIndex('group_roles', 'user_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('group_roles')
}
