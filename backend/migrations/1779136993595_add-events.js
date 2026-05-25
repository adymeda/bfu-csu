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
    pgm.createTable('events', {
        id: {
            type: 'bigserial',
            primaryKey: true,
        },
        title: {
            type: 'varchar(255)',
            notNull: true,
        },
        created_by: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        message_id: {
            type: 'bigint',
            references: '"messages"(id)',
            onDelete: 'SET NULL',
        },
        start_at: {
            type: 'timestamptz',
            notNull: true,
        },
        end_at: {
            type: 'timestamptz',
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    })

    pgm.addConstraint('events', 'events_end_after_start', 'CHECK (end_at IS NULL OR end_at >= start_at)')

    pgm.createIndex('events', 'created_by')
    pgm.createIndex('events', 'message_id')

    pgm.createTable('event_participants', {
        event_id: {
            type: 'bigint',
            notNull: true,
            references: '"events"(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
    }, {
        constraints: {
            primaryKey: ['event_id', 'user_id'],
        },
    })

    pgm.createIndex('event_participants', 'user_id')

    pgm.createTable('deadlines', {
        id: {
            type: 'bigserial',
            primaryKey: true,
        },
        title: {
            type: 'varchar(255)',
            notNull: true,
        },
        created_by: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        message_id: {
            type: 'bigint',
            references: '"messages"(id)',
            onDelete: 'SET NULL',
        },
        due_at: {
            type: 'timestamptz',
            notNull: true,
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    })

    pgm.createIndex('deadlines', 'created_by')
    pgm.createIndex('deadlines', 'message_id')

    pgm.createTable('deadline_assignees', {
        deadline_id: {
            type: 'bigint',
            notNull: true,
            references: '"deadlines"(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
    }, {
        constraints: {
            primaryKey: ['deadline_id', 'user_id'],
        },
    })

    pgm.createIndex('deadline_assignees', 'user_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('deadline_assignees')
    pgm.dropTable('deadlines')
    pgm.dropTable('event_participants')
    pgm.dropTable('events')
}