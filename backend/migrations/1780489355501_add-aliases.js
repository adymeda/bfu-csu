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
	pgm.createTable('group_aliases', {
		group_id: {
			type: 'integer',
			notNull: true,
			references: '"groups"(id)',
			onDelete: 'CASCADE',
		},
		alias: {
			type: 'varchar(255)',
			notNull: true,
		},
	}, {
		constraints: {
			primaryKey: ['group_id', 'alias'],
		},
	})
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('group_aliases')
}
