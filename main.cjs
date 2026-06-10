const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. Setup user data paths so they are writable regardless of install location
const userDataPath = app.getPath('userData');
process.env.NC_CONFIG_PATH = path.join(userDataPath, "workspace_config.json");
process.env.NC_UPLOADS_DIR = path.join(userDataPath, "uploads");
process.env.NC_DIARY_PATH = path.join(userDataPath, "diary_history.json");

// Auto-initialize config so user is not prompted in the Electron app
if (!fs.existsSync(process.env.NC_CONFIG_PATH)) {
  fs.writeFileSync(process.env.NC_CONFIG_PATH, JSON.stringify({
    baseDir: process.env.NC_UPLOADS_DIR,
    initialized: true
  }, null, 2), "utf-8");
}

// Define where the dist assets are (since we run from root in dev, or inside app.asar/dist in prod)
process.env.NODE_ENV = 'production';
process.env.NODE_ENV_DIST = path.join(__dirname, 'dist');

// Start the Express server directly within the electron node process.
const server = require('./dist/server.cjs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "NovelCraft AI",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Load the Express server that was started by server.cjs
  // It binds to port 3000 by default in server.ts
  mainWindow.loadURL('http://localhost:3000').catch(err => {
    // Retry if server is slow to bind
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000').catch(console.error);
    }, 2000);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
