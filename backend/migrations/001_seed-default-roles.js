/** @type {import("node-pg-migrate").MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO roles (name, rank) VALUES
      ('student', 100),
      ('teacher', 500),
      ('admin', 1000)
    ON CONFLICT (name) DO NOTHING;
  `)
}

exports.down = (pgm) => {
  pgm.sql(`DELETE FROM roles WHERE name IN ('student', 'teacher', 'admin');`)
}