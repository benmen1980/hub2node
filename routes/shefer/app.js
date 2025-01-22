// var https = require('https');
// var os = require('os');
// var path = require('path');
// var express = require('express');
// var router = express.Router();
// var packageJson = require(path.resolve(__dirname, '../../package.json'));
//
//
//
// // Base API URL
// const baseUrl = 'https://prioritydev4.simplyct.co.il/odata/Priority/tabula.ini/demo/LOGPART';
//
// // Function to get the server's IP address
// function getServerIP() {
//     const networkInterfaces = os.networkInterfaces();
//     for (const interfaceName in networkInterfaces) {
//         const addresses = networkInterfaces[interfaceName];
//         for (const address of addresses) {
//             if (address.family === 'IPv4' && !address.internal) {
//                 return address.address;
//             }
//         }
//     }
//     return '127.0.0.1';
// }
//
// // Function to make API requests
// function makeApiRequest(url, headers) {
//     return new Promise((resolve, reject) => {
//         const options = {
//             method: 'GET',
//             headers: headers,
//         };
//
//         const req = https.request(url, options, (res) => {
//             let data = '';
//             res.on('data', (chunk) => {
//                 data += chunk;
//             });
//
//             res.on('end', () => {
//                 if (res.statusCode >= 200 && res.statusCode < 300) {
//                     resolve(JSON.parse(data));
//                 } else {
//                     reject(new Error(`API returned status code ${res.statusCode}: ${data}`));
//                 }
//             });
//         });
//
//         req.on('error', (error) => {
//             reject(error);
//         });
//
//         req.end();
//     });
// }
//
// // Route to handle the search page (GET)
// router.get('/', (req, res) => {
//     const ipAddress = getServerIP();
//     res.send(`
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Shefer Search</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           margin: 0;
//           padding: 0;
//           background-color: #f8f9fa;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//         }
//         .container {
//           text-align: center;
//           width: 100%;
//           max-width: 600px;
//           margin: 20px auto;
//         }
//         header, footer {
//           width: 100%;
//           background-color: #4285f4;
//           color: white;
//           text-align: center;
//           padding: 10px 0;
//         }
//         header h1, footer p {
//           margin: 0;
//         }
//         input[type="text"] {
//           width: 100%;
//           max-width: 500px;
//           padding: 10px 20px;
//           font-size: 16px;
//           border: 1px solid #ddd;
//           border-radius: 24px;
//           outline: none;
//           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
//           transition: all 0.2s;
//         }
//         input[type="text"]:focus {
//           border-color: #4285f4;
//           box-shadow: 0 2px 5px rgba(66, 133, 244, 0.5);
//         }
//         .checkbox {
//           margin-top: 10px;
//           font-size: 14px;
//           color: #555;
//         }
//         button {
//           margin-top: 20px;
//           padding: 10px 30px;
//           font-size: 16px;
//           color: #fff;
//           background-color: #4285f4;
//           border: none;
//           border-radius: 24px;
//           cursor: pointer;
//           transition: background-color 0.2s;
//         }
//         button:hover {
//           background-color: #357ae8;
//         }
//         a {
//           display: inline-block;
//           margin-top: 20px;
//           text-decoration: none;
//           color: #4285f4;
//           font-size: 16px;
//         }
//         a:hover {
//           text-decoration: underline;
//         }
//       </style>
//     </head>
//     <body>
//       <header>
//         <h1>Shefer Search</h1>
//       </header>
//       <div class="container">
//         <form action="/shefer/app" method="POST">
//           <input type="text" name="query" placeholder="Type your search here..." required />
//           <br />
//           <div class="checkbox">
//             <label>
//               <input type="checkbox" name="useAnd" /> Check the box to get only products with all the words, and leave it empty to get products that includes even one.
//             </label>
//           </div>
//           <button type="submit">Search</button>
//         </form>
//       </div>
//       <footer>
//         <p>Developed by simplyct.co.il, 2025 | Version: ${packageJson.version} | Server IP: ${ipAddress}</p>
//       </footer>
//     </body>
//     </html>
//   `);
// });
//
// // Route to handle the search functionality (POST)
// router.post('/', async (req, res) => {
//     const searchString = req.body.query || '';
//     const useAnd = req.body.useAnd === 'on'; // Check if the "and" checkbox is selected
//
//     // Split the input string into an array of words
//     const words = searchString.split(' ');
//     const operator = useAnd ? 'and' : 'or'; // Use "and" or "or" based on checkbox
//
//     // Construct the filter string
//     const filter = words
//         .map(word => `PARTDES eq '%${word}%'`)
//         .join(` ${operator} `);
//
//     // Construct the API query
//     const query = {
//         $select: 'PARTNAME,PARTDES',
//         $filter: filter,
//     };
//
//     // Construct the URL with proper encoding
//     const url = `${baseUrl}?$select=${encodeURIComponent(query.$select)}&$filter=${encodeURIComponent(query.$filter)}`;
//     const headers = {
//         'Authorization': 'Basic QVBJOjEyMzQ1Njc=',
//         'Content-Type': 'application/json',
//     };
//
//     const ipAddress = getServerIP();
//
//     try {
//         const apiResponse = await makeApiRequest(url, headers);
//         const results = apiResponse.value || [];
//
//         // Generate results HTML
//         let resultsHtml = results.map(
//             item => `
//             <div style="border: 1px solid #ddd; border-radius: 8px; margin: 10px 0; padding: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
//               <h3 style="margin: 0; color: #333;">${item.PARTNAME}</h3>
//               <p style="margin: 5px 0 0; color: #555;">${item.PARTDES}</p>
//             </div>
//         `
//         ).join('');
//
//         res.send(`
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>Search Results</title>
//           <style>
//             body {
//               font-family: Arial, sans-serif;
//               margin: 0;
//               padding: 0;
//               background-color: #f8f9fa;
//               display: flex;
//               flex-direction: column;
//               align-items: center;
//             }
//             .container {
//               text-align: center;
//               width: 100%;
//               max-width: 600px;
//               margin: 20px auto;
//             }
//             header, footer {
//               width: 100%;
//               background-color: #4285f4;
//               color: white;
//               text-align: center;
//               padding: 10px 0;
//             }
//             header h1, footer p {
//               margin: 0;
//             }
//           </style>
//         </head>
//         <body>
//           <header>
//             <h1>Shefer Search Results</h1>
//           </header>
//           <div class="container">
//             ${resultsHtml}
//           </div>
//           <footer>
//             <p>Developed by simplyct.co.il, 2025 | Version: ${packageJson.version} | Server IP: ${ipAddress}</p>
//           </footer>
//         </body>
//         </html>
//       `);
//     } catch (error) {
//         console.error('Error fetching data:', error.message);
//         res.send(`
//         <!DOCTYPE html>
//         <html>
//         <head><title>Error</title></head>
//         <body>
//           <h1>Error</h1>
//           <p>Could not fetch data: ${error.message}</p>
//           <a href="/shefer/app">Go back</a>
//         </body>
//         </html>
//       `);
//     }
// });
//
// module.exports = router;
