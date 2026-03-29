const fs = require('fs');
const path = require('path');
const https = require('https');

async function fixVercelSettings() {
  console.log("Starting Vercel Settings Fix...");
  
  // 1. Get Token from auth.json
  const authPath = path.join(process.env.APPDATA || process.env.LOCALAPPDATA, 'vercel', 'auth.json');
  if (!fs.existsSync(authPath)) {
    console.error("No Vercel auth.json found at", authPath);
    return;
  }
  const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const token = authData.token;

  // 2. Get Project ID
  const projectData = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
  const projectId = projectData.projectId;
  
  console.log("Targeting Project:", projectId);

  // 3. Make PATCH request to Vercel API
  const data = JSON.stringify({
    buildCommand: "npm run build",
    installCommand: null, // null resets to default `npm install`
    framework: "vite"
  });

  const options = {
    hostname: 'api.vercel.com',
    path: `/v9/projects/${projectId}`,
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseBody = '';
    res.on('data', (d) => { responseBody += d; });
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("✅ Vercel Project Settings Successfully Overwritten!");
      } else {
        console.error("❌ Failed to update settings. Status:", res.statusCode);
        console.error("Response:", responseBody);
      }
    });
  });

  req.on('error', (e) => {
    console.error("Request error:", e);
  });

  req.write(data);
  req.end();
}

fixVercelSettings();
