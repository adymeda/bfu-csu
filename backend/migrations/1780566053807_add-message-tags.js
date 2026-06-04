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
	pgm.createTable('message_tags', {
		message_id: {
			type: 'bigint',
			primaryKey: true,
			references: '"messages"(id)',
			onDelete: 'CASCADE',
		},
		category: {
			type: 'varchar(32)',
		},
		requires_response: {
			type: 'boolean',
		},
		updated_at: {
			type: 'timestamptz',
			notNull: true,
			default: pgm.func('now()'),
		},
	})

	pgm.createIndex('message_tags', 'category')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('message_tags')
}
