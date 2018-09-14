"use strict";

module.exports =
  {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": "ncent-db",
    "host": process.env.DB_HOST,
    "port": process.env.DB_PORT,
    "dialect": "postgres",
    "logging": false
  };
