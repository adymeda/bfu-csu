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
	pgm.createTable('links', {
		user_id: {
			type: 'integer',
			notNull: true,
			references: '"users"(id)',
			onDelete: 'CASCADE',
		},
		link_type: {
			type: 'integer',
			notNull: true,
		},
		link_value: {
			type: 'varchar(255)',
			notNull: true,
		},
	}, {
		constraints: {
			primaryKey: ['user_id', 'link_type'],
		},
	})
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('links')
}
