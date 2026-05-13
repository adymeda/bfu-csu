/** @type {import("node-pg-migrate").MigrationBuilder} */
exports.up = (pgm) => {
  pgm.createTable("roles", {
    id: { type: "bigserial", primaryKey: true },
    name: { type: "varchar(64)", notNull: true, unique: true },
    rank: { type: "int", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })
  pgm.createIndex("roles", "rank")

  pgm.createTable("users", {
    id: { type: "bigserial", primaryKey: true },
    email: { type: "varchar(254)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    display_name: { type: "varchar(128)", notNull: true },
    accent_color: { type: "char(7)", notNull: true },
    avatar_url: { type: "text" },
    role_id: {
      type: "bigint",
      notNull: true,
      references: '"roles"',
      onDelete: "RESTRICT",
    },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })
  pgm.createIndex("users", "role_id")
  pgm.createIndex("users", "email")

  pgm.createTable("sessions", {
    id: { type: "bigserial", primaryKey: true },
    token: { type: "char(64)", notNull: true, unique: true },
    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    last_used_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })
  pgm.createIndex("sessions", "user_id")
  pgm.createIndex("sessions", "expires_at")

  pgm.createTable("groups", {
    id: { type: "bigserial", primaryKey: true },
    name: { type: "varchar(128)", notNull: true },
    description: { type: "text" },
    min_view_rank: { type: "int", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })

  pgm.createTable("group_members", {
    group_id: {
      type: "bigint",
      notNull: true,
      references: '"groups"',
      onDelete: "CASCADE",
    },
    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    added_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })
  pgm.addConstraint("group_members", "group_members_pkey", "PRIMARY KEY (group_id, user_id)")
  pgm.createIndex("group_members", "user_id")

  pgm.createTable("social_links", {
    id: { type: "bigserial", primaryKey: true },
    user_id: {
      type: "bigint",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    platform: { type: "varchar(32)", notNull: true },
    value: { type: "varchar(255)", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  })
  pgm.addConstraint("social_links", "social_links_user_platform_unique", "UNIQUE (user_id, platform)")
  pgm.createIndex("social_links", "user_id")
}

exports.down = (pgm) => {
  pgm.dropTable("social_links")
  pgm.dropTable("group_members")
  pgm.dropTable("groups")
  pgm.dropTable("sessions")
  pgm.dropTable("users")
  pgm.dropTable("roles")
}