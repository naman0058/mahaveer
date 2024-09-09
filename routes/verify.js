var express = require('express');
var router = express.Router();

var pool = require('./pool');


const util = require('util');
const queryAsync = util.promisify(pool.query).bind(pool);



// function userAuthenticationToken(req,res,next){
//     // const token = req.headers['authrorization'];
//     const token = undefined
//     if(!token) return res.status(401).json({message : 'Token not provided'})
//     jwt.verify(token,secretkey,(err,data)=>{
//       if(err) res.status(401).json({message:'Invalid Token Recieved'})
//       req.user = data
//       next();
//     })
//   }


// function userAuthenticationToken(req, res, next) {
//   const token = req.headers['authorization'];
//   if (!token) {
//       return res.status(401).json({ message: 'Token not provided' });
//   }
//   jwt.verify(token, secretkey, (err, data) => {
//       if (err) {
//           return res.status(401).json({ message: 'Invalid Token Received' });
//       }
//       req.user = data;
//       next();
//   });
// }



function adminAuthenticationToken(req,res,next){
  if(req.session.adminid) {
    req.categories = true;
     next();
  }
  else {
    res.render('login',{msg:'Wrong Credentials'})
    next()
  }
}



function vendorAuthenticationToken(req,res,next){
    if(req.session.vendorid) {
      req.categories = true;
       next();
    }
    else {
      res.redirect('/login?message=Wrong Credentials')
      next()
    }
  }
  

// async function vendorAuthenticationToken(req, res, next) {
//     try {
//         const result = await queryAsync('SELECT * FROM vendor WHERE id = ?', [req.query.id]);

//         if (result.length > 0) {
//             req.data = req.query.id;
//             next();
//         } else {
//             res.status(401).json({ msg: 'Invalid User ID' });
//             // If you're continuing the middleware chain after sending a response,
//             // you shouldn't call next() after sending the response.
//         }
//     } catch (error) {
//         console.error('Error while verifying user authentication token:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }







function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = date.getFullYear();
    return yyyy + '-' + mm + '-' + dd ;
  }


  function getCurrentDate() {
    const today = new Date();
    return formatDate(today);
  }
  
  
  function getCurrentWeekDates() {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (7 - today.getDay()));
    return { startDate: formatDate(startOfWeek), endDate: formatDate(endOfWeek) };
  }
  // Function to get the start and end dates of the current month
  
  function getCurrentMonthDates() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { startDate: formatDate(startOfMonth), endDate: formatDate(endOfMonth) };
  }
  
  function getLastMonthDates() {
    const today = new Date();
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    return { startDate: formatDate(firstDayOfLastMonth), endDate: formatDate(lastDayOfLastMonth) };
  }

  
  // Function to get the start and end dates of the current year
  
  function getCurrentYearDates() {
  
    //   const today = new Date();
  
    //   const startOfYear = new Date(today.getFullYear(), 3, 1);

    //   const endOfYear = new Date(today.getFullYear(), 2, 31);
  
    //   return { startDate: formatDate(startOfYear), endDate: formatDate(endOfYear) };

    const today = new Date();
   // Check if the current month is April or later
   // If so, the financial year starts from April of the current year
   // Otherwise, it starts from April of the previous year
   const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
   // The financial year ends on March 31st of the following year
   const endYear = today.getMonth() >= 3 ? today.getFullYear() + 1 : today.getFullYear();
   // Set the start date to April 1st of the start year
   const startDate = new Date(startYear, 3, 1);
   // Set the end date to March 31st of the end year
   const endDate = new Date(endYear, 2, 31);
   return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
  
  }


  function getLastFinancialYearDates() {
    const today = new Date();

    // Check if the current month is April or later
    // If so, the financial year started from April of the current year
    // Otherwise, it started from April of the previous year
    const startYear = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 2;

    // The financial year ended on March 31st of the current year
    const endYear = today.getMonth() >= 3 ? today.getFullYear() - 1 : today.getFullYear() - 1;

    // Set the start date to April 1st of the start year
    const startDate = new Date(startYear, 3, 1);

    // Set the end date to March 31st of the end year
    const endDate = new Date(endYear, 2, 31);

    return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
}



function generateOrderNumber(prefix = 'ORD') {
    // Get the current timestamp
    const timestamp = Date.now().toString(); // Convert to string

    // Generate a random number
    const randomNumber = Math.floor(Math.random() * 1000000).toString(); // Convert to string

    // Combine the prefix, timestamp, and random number
    const orderNumber = `${prefix}-${timestamp}-${randomNumber}`;

    return orderNumber;
}


function generateUniqueId(prefix = 'LPY') {
    // Get the current timestamp
    const timestamp = Date.now().toString(); // Convert to string

    // Generate a random number
    const randomNumber = Math.floor(Math.random() * 10000).toString(); // Convert to string

    // Combine the prefix, timestamp, and random number
    const orderNumber = `${prefix}-${timestamp}-${randomNumber}`;

    return orderNumber;
}



async function getDatas(tableName, columnName) {
    return new Promise((resolve, reject) => {
        pool.query(`SELECT name FROM ${tableName} WHERE id = ${columnName}`, (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result.length > 0) {
                resolve(result[0].name);
            } else {
                resolve(null);
            }
        });
    });
}


// console.log('Last Financial Year',getCurrentYearDates())



const nodemailer = require('nodemailer');




// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net', // GoDaddy's SMTP server
  port: 465, // Secure port for SSL
  secure: true, // Use SSL
  auth: {
    user: 'support@egadgetworld.in', // Your GoDaddy email address
    pass: 'Mahipal#@9451', // Your GoDaddy email password
  },
});
;




  
  
    async function sendInviduallyMail(result,subject,message) {
      try {
        console.log('Data Recieve',result); 
        // Fetch recipients from an API (replace 'api_url' with your API endpoint)
        const recipients = result; // Assuming the API returns an array of recipients
    
        // Loop through recipients and send emails
     
    
            // console.log('recipients',recipients)
            try {
              const mailOptions = {
                from: 'support@egadgetworld.in',
                to: result.email,
                subject: subject,
                html: `
                <html>
                  <head>
                    <style>
                      body {
                        style="font-family: Georgia;
                        color: black;
                      }
                      strong {
                        font-weight: bold;
                      }
                    </style>
                  </head>
                  <body style="font-family: Georgia;color:'black'">
                    ${message}
                  </body>
                </html>
              `,
            
              };
    
              // Send the email
              const info = await transporter.sendMail(mailOptions);
              console.log('information',info)
              console.log(`Email sent to ${result.email}: ${info.response}`);
            } catch (emailError) {
              console.error(`Error sending email to ${result.email}:`, emailError);
            }
          
        
      } catch (fetchError) {
        console.error('Error fetching recipients or sending emails:', fetchError);
      }
    }
  
  
  
  
    async function sendPromotionalMail(result, subject, message) {
      try {
        console.log('Data Received', result);
        
        const mailOptions = {
          from: 'support@egadgetworld.in',
          to: result.email,
          subject: subject,
          html: `
            <html>
              <head>
                <style>
                  body {
                    font-family: Georgia;
                    color: black;
                  }
                  strong {
                    font-weight: bold;
                  }
                </style>
              </head>
              <body style="font-family: Georgia; color: black;">
                ${message}
              </body>
            </html>
          `,
        };
    
        const info = await transporter.sendMail(mailOptions);
        console.log('Information', info);
        console.log(`Email sent to ${result.email}: ${info.response}`);
      } catch (emailError) {
        console.error(`Error sending email to ${result.email}:`, emailError);
      }
    }
  
  
  
    async function sendUserMail(result,subject,message) {
      try {
        console.log('Data Recieve',result); 
        console.log('Data Recieve',subject); 
        console.log('Data Recieve',message); 
  
        // Fetch recipients from an API (replace 'api_url' with your API endpoint)
        const recipients = result; // Assuming the API returns an array of recipients
    
        // Loop through recipients and send emails
     
    
            // console.log('recipients',recipients)
            try {
              const mailOptions = {
                from: 'support@egadgetworld.in',
                to: result,
                subject: subject,
                html: `
                <html>
                  <head>
                    <style>
                      body {
                        style="font-family: Georgia;
                        color: black;
                      }
                      strong {
                        font-weight: bold;
                      }
                    </style>
                  </head>
                  <body style="font-family: Georgia;color:'black'">
                    ${message}
                  </body>
                </html>
              `,
            
              };
    
              // Send the email
              const info = await transporter.sendMail(mailOptions);
              console.log('information',info)
              console.log(`Email sent to ${result}: ${info.response}`);
            } catch (emailError) {
              console.error(`Error sending email to ${result}:`, emailError);
            }
          
        
      } catch (fetchError) {
        console.error('Error fetching recipients or sending emails:', fetchError);
      }
    }
  

    async function profile(id) {
        try {
             let result = await queryAsync(`SELECT * FROM users WHERE id = '${id}'`);
            return result;
        } catch (error) {
            console.error('Error while fetching user:', error);
            throw new Error('Internal server error');
        }
      }


      async function getOrderDetails(value) {
        try {
            let result = await queryAsync(`SELECT o.*, u.name as username, u.number as usernumber, u.unique_id as uniqueid 
                                           FROM orders o 
                                           JOIN users u ON u.id = o.userid 
                                           WHERE o.orderid = ? 
                                           ORDER BY o.id DESC 
                                           LIMIT 1000`, [value]);
            
            return result;
        } catch (error) {
            console.error('Error while fetching user:', error);
            throw new Error('Internal server error');
        }
      }
      



      const axios = require('axios');

const sendWhatsAppMessage = async (phoneNumber, templateName, languageCode, bodyParameters = [], buttonParameters = []) => {
    const messageData = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: languageCode
            },
            components: []
        }
    };

    if (bodyParameters.length > 0) {
        messageData.template.components.push({
            type: 'body',
            parameters: bodyParameters.map(param => ({
                type: 'text',
                text: param
            }))
        });
    }

    if (buttonParameters.length > 0) {
        messageData.template.components.push({
            type: 'button',
            sub_type: 'url', // or 'flow' depending on your need
            index: 0,
            parameters: buttonParameters.map(param => ({
                type: 'text',
                text: param
            }))
        });
    }

    try {
        const response = await axios.post(
            'https://graph.facebook.com/v20.0/361494850388648/messages',
            messageData,
            {
                headers: {
                    'Authorization': 'Bearer EABws9wYxk3ABO4dszNo4lOA6E81RXZBJbIdlAj5LHmq7CLy2IVdTqF0DxZAIUJoUsCupY7ZBdHrNWKpawYf0AeTWYZAZB8cX3rMypu14SE8qBcYboiNdSiBCA5AUZCxZAYFwYZCWkIfDX8tKHcV2LbnxBi2rwIzjY9xPTnaNCJ9m7YQZC5fFUjFI1TuMZAjOvkf1UkWLEZBbVBm217VyZCZA0kV4ZD',
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('Message sent response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
        throw new Error('Error sending message');
    }
};



async function fetch_name(data) {

  try {
    if(data.category == 'mobile'){
      let ramname = await getDatas('mobile_filters',data.ram)
      return  data.modelno + ' | ' + ramname + ' | ' +  data.storage 
  }
  
  if(data.category == 'laptop'){
      let processorname = await getDatas('laptop_filters',data.processor)
      let generationname = await getDatas('laptop_filters',data.generation)
      let ramname = await getDatas('laptop_filters',data.ram)
  
  
  
      return  data.modelno + ' | ' + processorname + ' | ' + generationname + ' | ' + ramname + ' | ' + data.storage 
  }
  
  
  if(data.category == 'apple'){
      let processorname = await getDatas('apple_filters',data.processor)
      let subcategoryrname = await getDatas('apple_filters',data.subcategory)
  
    
  
  
  
      return  data.modelno + ' | ' + subcategoryrname + ' | ' + processorname +  ' | ' + data.storage
  }
  
  
  
  if(data.category == 'accessories' || data.category == 'new_parts' || data.category == 'refurbished_parts'){
      let brandname = await getDatas('parts_and_accessories_filters',data.brand)
     
      return  data.modelno + ' | ' + brandname + ' | ' + data.category.toUpperCase() 
  }
  
  
  } catch (error) {
    console.error('Error while fetching')
    throw new Error('Internal Server Error')
  }
  
}


function generatePassword(length) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};


function calculateTimeDifference(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();
  
  // Adjust the days if necessary
  if (days < 0) {
      months--;
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  
  // Adjust the months if necessary
  if (months < 0) {
      years--;
      months += 12;
  }
  
  return { years, months, days };
}


function calculateTimeDifferenceInDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const timeDiff = end - start;
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  return days;
}

// Function to calculate interest
function calculateInterest(principal, dailyRate, days) {
  return principal * (dailyRate / 100) * days;
}

  

  module.exports = {
    adminAuthenticationToken,
    getCurrentWeekDates,
    getCurrentMonthDates,
    getLastMonthDates,
    getCurrentYearDates,
    vendorAuthenticationToken,
    getCurrentDate,
    getLastFinancialYearDates,
    generateOrderNumber,
    generateUniqueId,
    getDatas,
    sendInviduallyMail,
    sendPromotionalMail,
    sendUserMail,
    profile,
    getOrderDetails,
    sendWhatsAppMessage,
    fetch_name,
    generatePassword,
    calculateTimeDifference,
    calculateInterest,
    calculateTimeDifferenceInDays
  }


//   wkltwfbwnhnvzmwr