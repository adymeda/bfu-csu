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
    pgm.createTable('groups', {
        id: {
            type: 'serial',
            primaryKey: true,
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        parent_id: {
            type: 'integer',
            references: '"groups"(id)',
            onDelete: 'CASCADE',
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    })

    pgm.createIndex('groups', 'parent_id')

    pgm.createTable('group_members', {
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
        added_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    }, {
        constraints: {
            primaryKey: ['group_id', 'user_id'],
        },
    })

    pgm.createIndex('group_members', 'user_id')

    pgm.createTable('group_admins', {
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
        is_super: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
    }, {
        constraints: {
            primaryKey: ['group_id', 'user_id'],
        },
    })

    pgm.createIndex('group_admins', 'user_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('group_admins')
    pgm.dropTable('group_members')
    pgm.dropTable('groups')
}
