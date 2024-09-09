
var mysql = require('mysql2')

const pool = mysql.createPool({

  host : 'db-mysql-blr1-78922-do-user-4199968-0.c.db.ondigitalocean.com',
  user: 'doadmin',
  password:'AVNS_GQrps4okJNd-Q3VSn68',
    database: 'management_app',
    port:'25060' ,
    multipleStatements: true,

  })



module.exports = pool;




