import sqlite3 from 'sqlite3';

// TODO: better error handling
const db = new sqlite3.Database('database.db', (err) => {
  if (err) console.error(err.message);
});

// TODO: return type missing, params untyped
function query(sql: string, params: any[]) {
  return db.prepare(sql).all(params);
}

async function fetchAll(sql: string, params: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    })
  })
}

async function fetchOne(sql: string, params: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      resolve(row)
    })
  })
}

async function run(sql: string, params: any[]): Promise<void> {
  return new Promise((resolve, reject) => {
    db.prepare(sql).all(params, (err, rows) => {
      if (err) reject(err);
      resolve();
    })
  })
}

async function setup() {

  console.log("setting up database...")

  const createKeysTable = `
    CREATE TABLE IF NOT EXISTS PRIVATE_KEYS(
    pub TEXT NOT NULL,
    source VARCHAR(15) CHECK(source IN ('user', 'backup')) NOT NULL,
    encryptedPrv STRING,
    provider STRING NOT NULL,
    kmsKey STRING NOT NULL,
    coin VARCHAR(30) NOT NULL,
    type VARCHAR(15) CHECK(type IN ('independent', 'tss')) NOT NULL,
    PRIMARY KEY (pub, source)
    );
  `;

  return db.run(createKeysTable, (err) => {
    if (err) {
      console.log("ERROR: cannot creat database");

      throw {
        message: "Cannot create keys table",
        code: 500
      }
    }
  })
}

export default {
  query, fetchAll, run, setup, fetchOne
};
