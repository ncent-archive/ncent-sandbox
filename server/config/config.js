"use strict";

module.exports =
    {
        "production": {
            "username": process.env.DB_USERNAME,
            "password": process.env.DB_PASSWORD,
            "database": "ncnt-test",
            "host": process.env.DB_HOST,
            "port": process.env.DB_PORT,
            "dialect": "postgres"
        },
        "local": {
            "username": "postgres",
            "password": "dickey",
            "database": "ncnt-dev",
            "host": "127.0.0.1",
            "port": 5432,
            "dialect": "postgres"
        }
    };