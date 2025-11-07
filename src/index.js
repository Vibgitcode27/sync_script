import { Composio } from "@composio/core";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

const composio = new Composio({
  apiKey: '3r9tnmi406draeuu7rbhf',
  toolkitVersions: { github: "20251027_00" }
});

const userId = 'default-user';
const integrationName = 'github';
const configId = 'ac_cu5EHHpaXzJs';

// Function to open URL in browser
function openBrowser(url) {
  const platform = process.platform;
  let command;
  
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  exec(command, (error) => {
    if (error) {
      console.log('⚠️ Could not auto-open browser. Please open the URL manually.');
    }
  });
}

// Function to wait for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to poll connection status
async function waitForAuthentication(connectionId, maxAttempts = 60) {
  console.log('🔄 Polling for authentication status...\n');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [userId],
      });
      
      for (const item of connectedAccounts.items) {
        if (item.id === connectionId) {
          const status = item.status || 'UNKNOWN';
          
          process.stdout.write(`\r⏳ Attempt ${attempt}/${maxAttempts} - Status: ${status}  `);
          
          if (status === 'ACTIVE') {
            console.log('\n\n✅ Authentication successful! Connection is now ACTIVE.\n');
            return { success: true, account: item };
          } else if (status === 'FAILED' || status === 'ERROR') {
            console.log('\n\n❌ Authentication failed. Connection status: ' + status + '\n');
            return { success: false, status };
          }
          
          break;
        }
      }
      
      await sleep(2000);
      
    } catch (error) {
      console.log(`\n⚠️ Error checking status: ${error.message}`);
    }
  }
  
  console.log('\n\n⏱️ Timeout: Authentication not completed within the time limit.\n');
  return { success: false, status: 'TIMEOUT' };
}

// Function to get GitHub username
async function getGitHubUsername() {
  try {
    const result = await composio.tools.execute("GITHUB_GET_THE_AUTHENTICATED_USER", {
      userId,
      arguments:{}
    });
    
    if (result && result.successful && result.data) {
      return result.data.login || result.data.username;
    }
  } catch (error) {
    console.error('❌ Error getting GitHub username:', error.message);
  }
  return null;
}

// Function to check if repo exists on GitHub
async function checkRepoExists(username, repoName) {
  try {
    console.log(`🔍 Checking if repository "${repoName}" exists on GitHub...`);
    
    const result = await composio.tools.execute("GITHUB_GET_A_REPOSITORY", {
      userId,
      arguments: {
        owner: username,
        repo: repoName
      }
    });
    
    if (result && result.successful && result.data) {
      console.log(`✅ Repository found: ${result.data.html_url}\n`);
      return { exists: true, data: result.data };
    }
  } catch (error) {
    console.log(`ℹ️ Repository "${repoName}" not found on GitHub.\n`);
  }
  return { exists: false };
}

// Function to create a new GitHub repository
async function createGitHubRepo(repoName, description = "Created via Composio") {
  try {
    console.log(`📦 Creating new repository: ${repoName}...`);
    
    const result = await composio.tools.execute("GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER", {
      userId,
      arguments: {
        name: repoName,
        description: description,
        private: false,
        auto_init: false
      }
    });
    
    if (result && result.successful && result.data) {
      console.log(`✅ Repository created: ${result.data.html_url}\n`);
      return { success: true, data: result.data };
    }
  } catch (error) {
    console.error('❌ Error creating repository:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to check git status
async function checkGitStatus() {
  try {
    // Check if git is initialized
    if (!fs.existsSync('.git')) {
      console.log('ℹ️ Git not initialized in this directory.\n');
      return { initialized: false, hasChanges: false };
    }
    
    const { stdout: status } = await execAsync('git status --porcelain');
    const hasChanges = status.trim().length > 0;
    
    if (hasChanges) {
      console.log('📝 Local changes detected:\n');
      const { stdout: shortStatus } = await execAsync('git status --short');
      console.log(shortStatus);
    } else {
      console.log('✓ No local changes detected.\n');
    }
    
    return { initialized: true, hasChanges };
  } catch (error) {
    return { initialized: false, hasChanges: false };
  }
}

// Function to initialize git repository
async function initializeGit() {
  try {
    console.log('🎬 Initializing git repository...');
    await execAsync('git init');
    console.log('✅ Git initialized.\n');
    return true;
  } catch (error) {
    console.error('❌ Error initializing git:', error.message);
    return false;
  }
}

// Function to add remote if not exists
async function setupRemote(username, repoName) {
  try {
    // Check if remote already exists
    try {
      const { stdout } = await execAsync('git remote get-url origin');
      console.log(`ℹ️ Remote origin already exists: ${stdout.trim()}`);
      
      // Update remote URL to ensure it's correct
      const remoteUrl = `https://github.com/${username}/${repoName}.git`;
      await execAsync(`git remote set-url origin ${remoteUrl}`);
      console.log(`✅ Remote URL updated to: ${remoteUrl}\n`);
    } catch {
      // Remote doesn't exist, add it
      const remoteUrl = `https://github.com/${username}/${repoName}.git`;
      await execAsync(`git remote add origin ${remoteUrl}`);
      console.log(`✅ Remote origin added: ${remoteUrl}\n`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error setting up remote:', error.message);
    return false;
  }
}

// Function to commit and push changes
async function commitAndPush(commitMessage = "Update from local") {
  try {
    console.log('📤 Staging changes...');
    await execAsync('git add .');
    
    console.log('💾 Committing changes...');
    await execAsync(`git commit -m "${commitMessage}"`);
    
    console.log('🚀 Pushing to GitHub...');
    
    // Try to push, handle first push scenario
    try {
      await execAsync('git push -u origin main');
    } catch (error) {
      // If main doesn't exist, try master
      try {
        await execAsync('git branch -M main');
        await execAsync('git push -u origin main');
      } catch (err) {
        throw err;
      }
    }
    
    console.log('✅ Successfully pushed to GitHub!\n');
    return true;
  } catch (error) {
    console.error('❌ Error during commit/push:', error.message);
    console.log('\n💡 Tip: Make sure you have git configured with your credentials.');
    return false;
  }
}

// Main sync function with push support
async function syncWithPush() {
  const repoName = path.basename(process.cwd());
  
  try {
    console.log('🔐 Connecting GitHub...\n');
    
    // Clean up existing connections
    try {
      const connectedAccounts = await composio.connectedAccounts.list({
        userIds: [userId],
      });
      
      for (const item of connectedAccounts.items) {
        if (item.authConfig.id === configId) {
          await composio.connectedAccounts.delete(item.id);
          console.log('🗑️ Cleaned up existing connection\n');
        }
      }
    } catch (error) {
      console.log('⚠️ No existing connections to clean up\n');
    }
    
    // Initiate new connection
    const connReq = await composio.connectedAccounts.initiate(
      userId,
      configId,
      {
        callbackUrl: `http://localhost:3000/auth?configId=${configId}&integration=${integrationName}`,
      }
    );
    
    console.log('👉 Opening browser for authentication...\n');
    openBrowser(connReq.redirectUrl);
    
    // Wait for authentication
    const authResult = await waitForAuthentication(connReq.id, 60);
    
    if (!authResult.success) {
      console.log('💔 Authentication failed. Please try again.');
      return;
    }
    
    console.log('🎉 GitHub successfully connected!\n');
    
    // Get GitHub username
    const username = await getGitHubUsername();
    if (!username) {
      console.log('❌ Could not retrieve GitHub username.');
      return;
    }
    
    console.log(`👤 GitHub User: ${username}`);
    console.log(`📁 Local Repository: ${repoName}\n`);
    
    // Check if repo exists on GitHub
    const repoCheck = await checkRepoExists(username, repoName);
    
    if (!repoCheck.exists) {
      // Create new repository
      const createResult = await createGitHubRepo(repoName);
      if (!createResult.success) {
        console.log('❌ Failed to create repository. Aborting.');
        return;
      }
    }
    
    // Check local git status
    const gitStatus = await checkGitStatus();
    
    if (!gitStatus.initialized) {
      console.log('🎬 Initializing local git repository...');
      const initSuccess = await initializeGit();
      if (!initSuccess) return;
    }
    
    // Setup remote
    const remoteSuccess = await setupRemote(username, repoName);
    if (!remoteSuccess) return;
    
    // Check for changes and push
    const currentStatus = await checkGitStatus();
    
    if (currentStatus.hasChanges) {
      console.log('📤 Preparing to push changes...\n');
      const pushSuccess = await commitAndPush();
      
      if (pushSuccess) {
        console.log('🎊 All done! Your changes are now on GitHub!');
        console.log(`🔗 View at: https://github.com/${username}/${repoName}\n`);
      }
    } else {
      console.log('✓ Everything is up to date. Nothing to push.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

syncWithPush();