require('dotenv').config()


module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: 5432,
    host: '127.0.0.1',  
    dialect: 'postgres'
  },
  stage: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: 5432,
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres'
  },  
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    port: 5432,
    host: process.env.POSTGRES_HOST,
    dialect: 'postgres'
  }  
}