import sqlite3 from 'sqlite3';

// TODO: better error handling
const db = new sqlite3.Database('database.db', (err) => {
  if (err) console.error(err.message);
});

// TODO: return type missing, params untyped
function query(sql: string, params: any[]) {
  return db.prepare(sql).all(params);
}

export default {
  query,
};
