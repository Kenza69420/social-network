import mysql from "mysql2/promise";

const db = await mysql.createPool({
  host: "mysqlstudenti.litv.sssvt.cz",
  user: "knezujan",
  password: "123456",
  database: "4a1_knezujan_db1",
});

export default db;
