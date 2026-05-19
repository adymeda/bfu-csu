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
    pgm.createTable('messages', {
        id: {
            type: 'bigserial',
            primaryKey: true,
        },
        sender_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        title: {
            type: 'varchar(255)',
            notNull: true,
        },
        content: {
            type: 'text',
            notNull: true,
        },
        reply_to: {
            type: 'bigint',
            references: '"messages"(id)',
            onDelete: 'SET NULL',
        },
        forwarded_from: {
            type: 'bigint',
            references: '"messages"(id)',
            onDelete: 'SET NULL',
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    })

    pgm.createIndex('messages', 'sender_id')

    pgm.createTable('message_recipients', {
        message_id: {
            type: 'bigint',
            notNull: true,
            references: '"messages"(id)',
            onDelete: 'CASCADE',
        },
        recipient_type: {
            type: 'integer',
            notNull: true,
        },
        recipient_id: {
            type: 'integer',
            notNull: true,
        },
    }, {
        constraints: {
            primaryKey: ['message_id', 'recipient_type', 'recipient_id'],
        },
    })

    pgm.createTable('message_states', {
        message_id: {
            type: 'bigint',
            notNull: true,
            references: '"messages"(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        is_read: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        is_favorite: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        is_deleted: {
            type: 'boolean',
            notNull: true,
            default: false,
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    }, {
        constraints: {
            primaryKey: ['message_id', 'user_id'],
        },
    })

    pgm.createIndex('message_states', 'user_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('message_states')
    pgm.dropTable('message_recipients')
    pgm.dropTable('messages')
}
