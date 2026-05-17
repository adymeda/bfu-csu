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
	pgm.createTable('users', {
		id: {
			type: 'serial',
			primaryKey: true,
		},
		email: {
			type: 'varchar(255)',
			notNull: true,
			unique: true,
		},
		password: {
			type: 'varchar(255)',
			notNull: true,
		},
		display_name: {
			type: 'varchar(255)',
			notNull: true,
		},
		accent_color: {
			type: 'char(6)',
			notNull: true,
			default: '21145f',
		},
		created_at: {
			type: 'timestamptz',
			notNull: true,
			default: pgm.func('now()'),
		},
		last_login_at: {
			type: 'timestamptz',
			notNull: true,
			default: "'1970-01-01 00:00:00+00'",
		},
	})
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
	pgm.dropTable('users')
}
