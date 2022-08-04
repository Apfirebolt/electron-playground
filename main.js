const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const connectDB = require('./app/config/db.js');

const User = require('./app/models/user');

// Connect to the database
connectDB();

// Set env
process.env.NODE_ENV = 'development'

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow

// Creates a new about window
function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    title: 'About BoilerPlate',
    width: 300,
    height: 300,
    icon: `${__dirname}/assets/icons/Icon_256x256.png`,
    resizable: false,
    backgroundColor: 'white',
  })

  aboutWindow.loadFile('./app/about.html')
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Electron Bootstrap Boilerplate',
    width: isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/assets/Icon_256x256.png`,
    resizable: isDev ? true : false,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  // Open dev tools for development when in developer mode
  mainWindow.webContents.openDevTools()
  mainWindow.loadFile('./app/index.html')
}

app.on('ready', () => {
  createMainWindow()

  // Add a menu to the main window
  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)

  mainWindow.on('ready', () => (mainWindow = null))
})

// Adding a sample Menu
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: 'fileMenu',
  },
  ...(!isMac
    ? [
        {
          label: 'Help',
          submenu: [
            {
              label: 'About',
              click: createAboutWindow,
            },
            {
              label: 'Sub Menu',
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
]

// Load User Data
ipcMain.on('user:loadUsers', getUsers)

ipcMain.on('form:insertData', async (e, data) => {
  // Get the data from the form and insert a new record
  try {
    const user = await User.create({
      email: data.email,
      password: data.password,
    })
    if (user) {
      getUsers();
    }
  } catch (error) {
    console.log('Captured error ', error)
  }
})

// Send user items
async function getUsers() {
  try {
    const users = await User.find().sort({ created: 1 })
    mainWindow.webContents.send('user:getUsers', JSON.stringify(users))
  } catch (err) {
    console.log(err)
  }
}

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

