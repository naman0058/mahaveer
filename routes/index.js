var express = require('express');
var router = express.Router();
var folder = 'Vendor'
var newFolder = 'New'
var listFolder = 'List'

var pool =  require('./pool')
var verify = require('./verify')
const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);
const allowedTables = ['customer', 'investor', 'loan']; // Define allowed tables


/* GET home page. */
router.get('/', verify.vendorAuthenticationToken,function(req, res, next) {
  res.render(`${folder}/dashboard`, { title: 'Express' });
});


router.get('/dashboard/:pagename',verify.vendorAuthenticationToken,(req,res)=>{
  res.render(`${newFolder}/${req.params.pagename}`, { title: 'Express' });
})





// router.get('/dashboard/:tablename/list',verify.vendorAuthenticationToken,(req,res)=>{
//   const { tablename } = req.params;

//   if (!allowedTables.includes(tablename)) {
//     return res.status(400).json({ msg: 'Invalid Data' });
//   }



//   if(tablename =='loan'){
//     pool.query(`select t.* , 
//       (select c.name from customer c where c.id = t.customerid) as customername,
//       (select c.number from customer c where c.id = t.customerid) as customernumber,
//       (select c.father_name from customer c where c.id = t.customerid) as customefather_name,
//       (select c.address from customer c where c.id = t.customerid) as customeraddress

//       from ${tablename} t where t.vendorid = '${req.session.vendorid}' order by t.id desc`,(err,result)=>{
//       if(err) throw err;
//       else {

//         const currentDate = verify.getCurrentDate();
//         const updatedResults = result.map(item => {
//           const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
//           const months = timeDiff.years * 12 + timeDiff.months;
//           const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
//           const dailyRate = item.rate_of_interest / 30; // Assuming 30 days in a month
//              const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
//              console.log(item.amount, dailyRate, days)
//           return {
//               ...item,
//               timeDiff,
//               interestAmount,
                           
//           };
//         });
//         res.render(`${listFolder}/${tablename}`, { title: 'Express',result:updatedResults  , tablename , });
  
//       }
//     })
//   }
//   else{
//     pool.query(`select * from ${tablename} where vendorid = '${req.session.vendorid}' order by id desc`,(err,result)=>{
//       if(err) throw err;
//       else {
//         res.render(`${listFolder}/${tablename}`, { title: 'Express',result , tablename});
  
//       }
//     })
//   }

  
// })



router.get('/dashboard/:tablename/list', verify.vendorAuthenticationToken, async (req, res) => {
  const { tablename } = req.params;

  if (!allowedTables.includes(tablename)) {
    return res.status(400).json({ msg: 'Invalid Data' });
  }

  const limit = 100; // Number of records per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    let query, values;

    if (tablename === 'loan') {
      query = `
        SELECT t.*, c.name AS customername, c.number AS customernumber, 
               c.father_name AS customefather_name, c.address AS customeraddress,i.name AS investorname
        FROM ${tablename} t
        JOIN customer c ON c.id = t.customerid
        LEFT JOIN  investor i ON i.id = t.investorid
        WHERE t.vendorid = ?
        ORDER BY t.id DESC
        LIMIT ? OFFSET ?
      `;
      values = [req.session.vendorid, limit, offset];
    } else {
      query = `
        SELECT * 
        FROM ${tablename} 
        WHERE vendorid = ? 
        ORDER BY id DESC 
        LIMIT ? OFFSET ?
      `;
      values = [req.session.vendorid, limit, offset];
    }

    // Execute the query
    const [rows] = await pool.promise().query(query, values);

    if (tablename === 'loan') {
      const currentDate = verify.getCurrentDate();
      const updatedResults = rows.map(item => {
        const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
        const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
        const dailyRate = item.rate_of_interest / 30; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${listFolder}/${tablename}`, { title: 'Express', result: updatedResults, tablename });
    } else {
      res.render(`${listFolder}/${tablename}`, { title: 'Express', result: rows, tablename });
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});




router.get('/dashboard/view/loan', verify.vendorAuthenticationToken, async (req, res) => {


  const limit = 100; // Number of records per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    let query, values;

      query = `
        SELECT 
    t.*, 
    c.name AS customername, 
    c.number AS customernumber, 
    c.father_name AS customefather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.customerid = ?
ORDER BY 
    t.id DESC
LIMIT ? OFFSET ?
      `;
      values = [req.query.customerid, limit, offset];
    

    // Execute the query
    const [rows] = await pool.promise().query(query, values);

      const currentDate = verify.getCurrentDate();
      const updatedResults = rows.map(item => {
        const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
        const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
        const dailyRate = item.rate_of_interest / 30; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${listFolder}/loan`, { title: 'Express', result: updatedResults, tablename:'loan' });
    
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});





router.get('/dashboard/view/investment', verify.vendorAuthenticationToken, async (req, res) => {


  const limit = 100; // Number of records per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    let query, values;

      query = `
        SELECT 
    t.*, 
    c.name AS customername, 
    c.number AS customernumber, 
    c.father_name AS customefather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.investorid = ?
ORDER BY 
    t.id DESC
LIMIT ? OFFSET ?
      `;
      values = [req.query.investorid, limit, offset];
    

    // Execute the query
    const [rows] = await pool.promise().query(query, values);

      const currentDate = verify.getCurrentDate();
      const updatedResults = rows.map(item => {
        const timeDiff = verify.calculateTimeDifference(item.transfer_date, currentDate);
        const days = verify.calculateTimeDifferenceInDays(item.transfer_date, currentDate);
        const dailyRate = item.rate_of_interest / 30; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${listFolder}/investment`, { title: 'Express', result: updatedResults, tablename:'loan' });
    
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});



router.get('/loan/transfer',(req,res)=>{
  pool.query(`select * from investor where vendorid = '${req.session.vendorid}' order by id desc`,(err,result)=>{
    if(err) throw err;
    else {
      res.render(`${listFolder}/trasnfer`,{result,loanid:req.query.loanid})
    }
  })
})



router.get('/loan/assign', (req, res) => {
  const { investorid, loanid } = req.query;
  const today = verify.getCurrentDate()

  // Validate input to prevent SQL Injection and other errors
  if (!investorid || !loanid) {
    return res.status(400).json({ msg: 'Invalid input data' });
  }

  // Use prepared statements to avoid SQL injection and improve performance
  const query = `UPDATE loan SET istransfer = ?, investorid = ?, transfer_date = ? WHERE id = ?`;
  const values = ['yes', investorid, today, loanid];

  pool.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating loan:', err);
      return res.status(500).json({ msg: 'Server error' });
    }

    res.redirect('/dashboard/loan/list');
  });
});




router.get('/api/customers',verify.vendorAuthenticationToken,(req,res)=>{
 
  pool.query(`select * from customer where vendorid = '${req.session.vendorid}' order by name`,(err,result)=>{
    if(err) throw err;
    else {
     res.json(result)

    }
  })
})


router.get('/api/customers/:id',verify.vendorAuthenticationToken,(req,res)=>{
 
  pool.query(`select * from customer where id = '${req.params.id}'`,(err,result)=>{
    if(err) throw err;
    else {
     res.json(result)

    }
  })
})





router.post('/dashboard/data/:tablename/insert', async (req, res) => {
  const { tablename } = req.params;
  const body = req.body;
  body.created_at = verify.getCurrentDate();
  body.updated_at = verify.getCurrentDate();
  body.vendorid = req.session.vendorid

  console.log('body comes',body)

  // Validate table name to prevent SQL injection
  if (!allowedTables.includes(tablename)) {
    return res.status(400).json({ msg: 'Invalid Data' });
  }

  try {
    // Use parameterized queries to prevent SQL injection
    const result = await queryAsync(`INSERT INTO ?? SET ?`, [tablename, body]);

    // Return success response
    res.json({ msg: 'success' });
  } catch (err) {
    console.error('Database Insertion Error:', err.message);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
});

router.get('/login',(req,res)=>{
  res.render(`${folder}/login`, { title: 'Express' , msg : req.query.message});
})


router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const today_date = verify.getCurrentDate();
console.log(today_date)
  try {
    // Use parameterized queries to prevent SQL injection
    const result = await queryAsync(
      `SELECT * FROM vendor WHERE username = ? AND password = ? AND expiry_date >= ?`,
      [username, password, today_date]
    );

    // 'result' should be an array, ensure it's defined and has content
    if (result && result.length > 0) {
      const vendorid = result[0].id;
      req.session.vendorid = result[0].id;
      // Handle successful login
      res.redirect('/')
    } else {
      // Handle unsuccessful login
      res.redirect('/login?message=Account Not Found or Account Suspended');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});





module.exports = router;
