// import { Composio } from "@composio/core";
// import path from "path";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execAsync = promisify(exec);

// const composio = new Composio({
//   apiKey: '3r9tnmi406draeuu7rbhf',
// });

// const userId = 'default-user';
// const integrationName = 'github';
// const configId = 'ac_cu5EHHpaXzJs';

// // Function to open URL in browser
// function openBrowser(url) {
//   const platform = process.platform;
//   let command;
  
//   if (platform === 'darwin') {
//     command = `open "${url}"`;
//   } else if (platform === 'win32') {
//     command = `start "" "${url}"`;
//   } else {
//     command = `xdg-open "${url}"`;
//   }
  
//   exec(command, (error) => {
//     if (error) {
//       console.log('⚠️ Could not auto-open browser. Please open the URL manually.');
//     }
//   });
// }

// async function sync() {
//   const repoName = path.basename(process.cwd());
  
//   try {
//     console.log('🔐 Connecting GitHub...\n');
    
//     // List all connected accounts
//     try {
//       const connectedAccounts = await composio.connectedAccounts.list({
//         userIds: [userId],
//       });
      
//       console.log(`📋 Found ${connectedAccounts.items.length} connected account(s):\n`);
      
//       for (const item of connectedAccounts.items) {
//         console.log(`- Account ID: ${item.id}`);
//         console.log(`  Config ID: ${item.authConfig.id}`);
//         console.log(`  Integration: ${item.appName || 'N/A'}`);
//         console.log(`  Status: ${item.status || 'N/A'}`);
        
//         if (item.authConfig.id === configId) {
//           console.log(`  ⭐ This matches your current configId!`);
//           await composio.connectedAccounts.delete(item.id);
//           console.log('  🗑️ Deleted existing connection');
//         }
//         console.log('');
//       }
//     } catch (error) {
//       console.log('⚠️ Error listing accounts or no existing connections\n');
//     }
    
//     // Initiate new connection
//     const connReq = await composio.connectedAccounts.initiate(
//       userId,
//       configId,
//       {
//         callbackUrl: `http://localhost:3000/auth?configId=${configId}&integration=${integrationName}`,
//       }
//     );
    
//     console.log('👉 Opening browser automatically...\n');
//     console.log('🔗 Authorization URL:');
//     console.log(connReq.redirectUrl);
//     console.log(`\n🆔 Connection ID: ${connReq.id}`);
//     console.log('\n⏳ Please authorize in your browser...\n');
    
//     // Open browser automatically
//     openBrowser(connReq.redirectUrl);
    
//     console.log('✅ Connection initiated!\n');
//     console.log('📁 Repo:', repoName);
//     console.log('\nℹ️ Note: Complete the authorization in your browser to finish the connection.');
    
//   } catch (error) {
//     console.error('❌ Error:', error.message);
//     if (error.details) {
//       console.error('Details:', error.details);
//     }
//   }
// }

// sync();



// import { Composio } from "@composio/core";
// import path from "path";
// import { exec } from "child_process";

// const composio = new Composio({
//   apiKey: '3r9tnmi406draeuu7rbhf',
// });

// const userId = 'default-user';
// const integrationName = 'github';
// const configId = 'ac_cu5EHHpaXzJs';

// // Function to open URL in browser
// function openBrowser(url) {
//   const platform = process.platform;
//   let command;
  
//   if (platform === 'darwin') {
//     command = `open "${url}"`;
//   } else if (platform === 'win32') {
//     command = `start "" "${url}"`;
//   } else {
//     command = `xdg-open "${url}"`;
//   }
  
//   exec(command, (error) => {
//     if (error) {
//       console.log('⚠️ Could not auto-open browser. Please open the URL manually.');
//     }
//   });
// }

// // Function to wait for a specified time
// function sleep(ms) {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// // Function to poll connection status
// async function waitForAuthentication(connectionId, maxAttempts = 60) {
//   console.log('🔄 Polling for authentication status...\n');
  
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     try {
//       const connectedAccounts = await composio.connectedAccounts.list({
//         userIds: [userId],
//       });
      
//       for (const item of connectedAccounts.items) {
//         if (item.id === connectionId) {
//           const status = item.status || 'UNKNOWN';
          
//           process.stdout.write(`\r⏳ Attempt ${attempt}/${maxAttempts} - Status: ${status}  `);
          
//           if (status === 'ACTIVE') {
//             console.log('\n\n✅ Authentication successful! Connection is now ACTIVE.\n');
//             return { success: true, account: item };
//           } else if (status === 'FAILED' || status === 'ERROR') {
//             console.log('\n\n❌ Authentication failed. Connection status: ' + status + '\n');
//             return { success: false, status };
//           }
          
//           break;
//         }
//       }
      
//       // Wait 2 seconds before next poll
//       await sleep(2000);
      
//     } catch (error) {
//       console.log(`\n⚠️ Error checking status: ${error.message}`);
//     }
//   }
  
//   console.log('\n\n⏱️ Timeout: Authentication not completed within the time limit.\n');
//   return { success: false, status: 'TIMEOUT' };
// }

// async function sync() {
//   const repoName = path.basename(process.cwd());
  
//   try {
//     console.log('🔐 Connecting GitHub...\n');
    
//     // List all connected accounts
//     try {
//       const connectedAccounts = await composio.connectedAccounts.list({
//         userIds: [userId],
//       });
      
//       console.log(`📋 Found ${connectedAccounts.items.length} connected account(s):\n`);
      
//       for (const item of connectedAccounts.items) {
//         console.log(`- Account ID: ${item.id}`);
//         console.log(`  Config ID: ${item.authConfig.id}`);
//         console.log(`  Integration: ${item.appName || 'N/A'}`);
//         console.log(`  Status: ${item.status || 'N/A'}`);
        
//         if (item.authConfig.id === configId) {
//           console.log(`  ⭐ This matches your current configId!`);
//           await composio.connectedAccounts.delete(item.id);
//           console.log('  🗑️ Deleted existing connection');
//         }
//         console.log('');
//       }
//     } catch (error) {
//       console.log('⚠️ Error listing accounts or no existing connections\n');
//     }
    
//     // Initiate new connection
//     const connReq = await composio.connectedAccounts.initiate(
//       userId,
//       configId,
//       {
//         callbackUrl: `http://localhost:3000/auth?configId=${configId}&integration=${integrationName}`,
//       }
//     );
    
//     console.log('👉 Opening browser automatically...\n');
//     console.log('🔗 Authorization URL:');
//     console.log(connReq.redirectUrl);
//     console.log(`\n🆔 Connection ID: ${connReq.id}\n`);
    
//     // Open browser automatically
//     openBrowser(connReq.redirectUrl);
    
//     // Wait for authentication
//     const result = await waitForAuthentication(connReq.id, 60);
    
//     if (result.success) {
//       console.log('🎉 GitHub successfully connected!');
//       console.log('📁 Repo:', repoName);
//       console.log('\n✨ You can now proceed with your operations!');
//     } else {
//       console.log('💔 Connection failed or timed out.');
//       console.log('Status:', result.status);
//       console.log('\n🔄 Please try running the script again.');
//     }
    
//   } catch (error) {
//     console.error('\n❌ Error:', error.message);
//     if (error.details) {
//       console.error('Details:', error.details);
//     }
//   }
// }

// sync();
