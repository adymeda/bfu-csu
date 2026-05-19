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
    pgm.createTable('attachments', {
        id: {
            type: 'bigserial',
            primaryKey: true,
        },
        uploader_id: {
            type: 'integer',
            notNull: true,
            references: '"users"(id)',
            onDelete: 'CASCADE',
        },
        original_name: {
            type: 'varchar(255)',
            notNull: true,
        },
        mime_type: {
            type: 'varchar(127)',
            notNull: true,
        },
        size_bytes: {
            type: 'bigint',
            notNull: true,
        },
        storage_name: {
            type: 'varchar(64)',
            notNull: true,
            unique: true,
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    })

    pgm.createIndex('attachments', 'uploader_id')

    pgm.createTable('message_attachments', {
        message_id: {
            type: 'bigint',
            notNull: true,
            references: '"messages"(id)',
            onDelete: 'CASCADE',
        },
        attachment_id: {
            type: 'bigint',
            notNull: true,
            references: '"attachments"(id)',
            onDelete: 'CASCADE',
        },
    }, {
        constraints: {
            primaryKey: ['message_id', 'attachment_id'],
        },
    })

    pgm.createIndex('message_attachments', 'attachment_id')
}

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
    pgm.dropTable('message_attachments')
    pgm.dropTable('attachments')
}
