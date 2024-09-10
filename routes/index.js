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
router.get('/', verify.vendorAuthenticationToken, async function (req, res, next) {
  const vendorId = req.session.vendorid;

  // Combined query to fetch all required information
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS total_pending,
      COALESCE(SUM(CASE WHEN istransfer = 'yes' AND status = 'pending' THEN amount END), 0) AS total_transferred,
      COALESCE(SUM(CASE WHEN istransfer IS NULL AND status = 'pending' THEN amount END), 0) AS total_not_transferred,
      COALESCE(SUM(CASE WHEN created_at < DATE_SUB(CURDATE(), INTERVAL 1 YEAR) AND status = 'pending' THEN amount END), 0) AS total_amount_last_year
    FROM loan
    WHERE vendorid = ?;

    SELECT 
      investor.*, 
      COALESCE(SUM(loan.amount), 0) AS total_invested
    FROM investor
    LEFT JOIN loan ON investor.id = loan.investorid 
    WHERE loan.vendorid = ? AND loan.status = 'pending'
    GROUP BY investor.id;
  `;

  try {
    // Using promise-based query execution for better error handling and async flow
    const [loanResults, investorResults] = await queryAsync(query, [vendorId, vendorId]);

    // Send the combined results as JSON
    // res.json({ loanResults, investorResults });
    res.render(`${folder}/dashboard`,{loanResults, investorResults})
  } catch (err) {
    console.error('Error executing queries:', err);
    res.status(500).json({ msg: 'Server error' });
  }
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
//       (select c.father_name from customer c where c.id = t.customerid) as customerfather_name,
//       (select c.address from customer c where c.id = t.customerid) as customeraddress

//       from ${tablename} t where t.vendorid = '${req.session.vendorid}' order by t.id desc`,(err,result)=>{
//       if(err) throw err;
//       else {

//         const currentDate = verify.getCurrentDate();
//         const updatedResults = result.map(item => {
//           const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
//           const months = timeDiff.years * 12 + timeDiff.months;
//           const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
//           const dailyRate = item.rate_of_interest / 31; // Assuming 30 days in a month
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
               c.father_name AS customerfather_name, c.address AS customeraddress,i.name AS investorname
        FROM ${tablename} t
        JOIN customer c ON c.id = t.customerid
        LEFT JOIN  investor i ON i.id = t.investorid
        WHERE t.vendorid = ? and t.status = 'pending'
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
        const dailyRate = item.rate_of_interest / 31; // Assuming 30 days in a month
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
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.customerid = ? and t.status = 'pending'
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
        const dailyRate = item.rate_of_interest / 31; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${listFolder}/loan`, { title: 'Express', result: updatedResults, tablename:'loan',customerid:req.query.customerid });
    
    
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
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.investorid = ? and t.status = 'pending'
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
        const dailyRate = item.transfer_rate / 31; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${listFolder}/investment`, { title: 'Express', result: updatedResults, tablename:'loan' , investorid : req.query.investorid });
    
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});




router.get('/dashboard/loan/details', verify.vendorAuthenticationToken, async (req, res) => {


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
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.id = ?
ORDER BY 
    t.id DESC
LIMIT ? OFFSET ?
      `;
      values = [req.query.loanid, limit, offset];
    

    // Execute the query
    const [rows] = await pool.promise().query(query, values);

      const currentDate = verify.getCurrentDate();
      const updatedResults = rows.map(item => {
        const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
        const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
        const dailyRate = item.rate_of_interest / 31; // Assuming 30 days in a month
        const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);
        
        return {
          ...item,
          timeDiff,
          interestAmount,
        };
      });
      
      res.render(`${newFolder}/loandetails`, { title: 'Express', result: updatedResults, tablename:'loan' });
    
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});




router.get('/dashboard/one/year/old/loan', verify.vendorAuthenticationToken, async (req, res) => {
  const limit = 100; // Number of records per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT 
        t.*, 
        c.name AS customername, 
        c.number AS customernumber, 
        c.father_name AS customerfather_name, 
        c.address AS customeraddress,
        i.name AS investorname -- Add the investor name from the investor table
      FROM 
        loan t
      JOIN 
        customer c ON c.id = t.customerid
      LEFT JOIN 
        investor i ON i.id = t.investorid -- Join the investor table to get the investor name
      WHERE 
        t.vendorid = ? 
        AND t.status = 'pending'
        AND t.created_at < DATE_SUB(CURDATE(), INTERVAL 1 YEAR) -- Filter for loans older than 1 year
      ORDER BY 
        t.id DESC
      LIMIT ? OFFSET ?
    `;

    const values = [req.session.vendorid, limit, offset];

    // Execute the query
    const [rows] = await pool.promise().query(query, values);

    const currentDate = verify.getCurrentDate();
    const updatedResults = rows.map(item => {
      const timeDiff = verify.calculateTimeDifference(item.created_at, currentDate);
      const days = verify.calculateTimeDifferenceInDays(item.created_at, currentDate);
      const dailyRate = item.rate_of_interest / 31; // Assuming 30 days in a month
      const interestAmount = verify.calculateInterest(item.amount, dailyRate, days);

      return {
        ...item,
        timeDiff,
        interestAmount,
      };
    });

    res.render(`${listFolder}/oneyearoldloan`, { title: 'Express', result: updatedResults, tablename: 'loan', customerid: req.query.customerid });

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



router.get('/loan/assign', async (req, res) => {
  const { investorid, loanid } = req.query;
  const today = verify.getCurrentDate();

  // Validate input to prevent SQL Injection and other errors
  if (!investorid || !loanid) {
    return res.status(400).json({ msg: 'Invalid input data' });
  }

  try {
    // Use a prepared statement to fetch loan amount
    const [loanResult] = await queryAsync('SELECT amount FROM loan WHERE id = ?', [loanid]);

    if (loanResult.length === 0) {
      return res.status(404).json({ msg: 'Loan not found' });
    }


    const amount = loanResult.amount;

    // Use a prepared statement to fetch investor details
    const [investorResult] = await queryAsync('SELECT interest_rate1, interest_rate2 FROM investor WHERE id = ?', [investorid]);

    if (investorResult.length === 0) {
      return res.status(404).json({ msg: 'Investor not found' });
    }

    // Determine the transfer rate based on the amount
    const transfer_rate = amount < 200000 ? investorResult.interest_rate1 : investorResult.interest_rate2;

    // Update the loan using a prepared statement
    await queryAsync(
      'UPDATE loan SET istransfer = ?, investorid = ?, transfer_date = ?, transfer_rate = ? WHERE id = ?',
      ['yes', investorid, today, transfer_rate, loanid]
    );

    res.redirect('/dashboard/loan/list');

  } catch (err) {
    console.error('Error processing loan assignment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
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
  body.vendorid = req.session.vendorid;
  body.status = 'pending'

  console.log('body comes',body)

  // Validate table name to prevent SQL injection
  if (!allowedTables.includes(tablename)) {
    return res.status(400).json({ msg: 'Invalid Data' });
  }

  try {
    // Use parameterized queries to prevent SQL injection
    const result = await queryAsync(`INSERT INTO ?? SET ?`, [tablename, body]);

    // Return success response
    // res.json({ msg: 'success' });
    res.render('print',{body})
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




router.post('/dashboard/clear/loan',(req,res)=>{
  let today = verify.getCurrentDate();
  pool.query(`update loan set customer_image = '${req.body.customer_image}' , status = 'clear' , updated_at = '${today}' where id = '${req.body.loanid}'`,(err,result)=>{
    if(err) throw err;
    else res.json({msg:'success'})
  })
})



router.get('/dashboard/loan/history',(req,res)=>{
  pool.query(`SELECT 
    t.*, 
    c.name AS customername, 
    c.number AS customernumber, 
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.vendorid = '${req.session.vendorid}' and t.status = 'clear'
ORDER BY 
    t.id DESC`,(err,result)=>{
    if(err) throw err;
    else res.render(`${listFolder}/history`,{result,type:'all'})
  })
})



router.get('/dashboard/user/history',(req,res)=>{
  pool.query(`SELECT 
    t.*, 
    c.name AS customername, 
    c.number AS customernumber, 
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.customerid = '${req.query.customerid}' and t.status = 'clear'
ORDER BY 
    t.id DESC`,(err,result)=>{
    if(err) throw err;
    else res.render(`${listFolder}/history`,{result,type:'user'})
  })
})



router.get('/dashboard/investment/history',(req,res)=>{
  pool.query(`SELECT 
    t.*, 
    c.name AS customername, 
    c.number AS customernumber, 
    c.father_name AS customerfather_name, 
    c.address AS customeraddress,
    i.name AS investorname -- Add the investor name from the investor table
FROM 
    loan t
JOIN 
    customer c ON c.id = t.customerid
LEFT JOIN 
    investor i ON i.id = t.investorid -- Join the investor table to get the investor name
WHERE 
    t.investorid = '${req.query.investorid}' and t.status = 'clear'
ORDER BY 
    t.id DESC`,(err,result)=>{
    if(err) throw err;
    else res.render(`${listFolder}/history`,{result,type:'investor'})
  })
})




router.get('/sign-out', (req, res) => {
  req.session.vendorid = null;
      res.redirect('/');
  });




module.exports = router;
