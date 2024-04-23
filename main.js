const electron = require("electron");
const fs = require("fs");
const { app, BrowserWindow, ipcMain, dialog, Menu } = electron;

let win;
let filePath;
const isMac = process.platform === "darwin";
const menuTemplate = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            { role: "about" },
            { type: "separator" },
            { role: "services" },
            { type: "separator" },
            { role: "hide" },
            { role: "hideOthers" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" },
          ],
        },
      ]
    : []),
  {
    label: "File",
    submenu: [
      {
        label: "Save",
        click: () => {
          win.webContents.send("save-clicked");
        },
      },
      {
        label: "Save As",
        click: () => {
          filePath = undefined;
          win.webContents.send("save-clicked");
        },
      },
    ],
  },
  { role: "editMenu" },
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

app.on("ready", () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadFile("index.html");
  win.webContents.openDevTools();
  win.setMenu(menu);
});

ipcMain.on("save", (event, text) => {
  console.log("Received text to save:", text);
  if (filePath === undefined) {
    dialog
      .showSaveDialog(win, { defaultPath: "filename.txt" })
      .then((result) => {
        if (!result.canceled && result.filePath) {
          filePath = result.filePath;
          console.log("File saved to:", filePath);
          writeToFile(text);
        } else {
          console.log("Save dialog was canceled or no path selected.");
        }
      })
      .catch((error) => {
        console.error("Error showing save dialog:", error);
      });
  } else {
    writeToFile(text);
  }
});

function writeToFile(data) {
  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error("Error saving file:", err);
    } else {
      console.log("File saved successfully!");
      win.webContents.send("saved", "success");
    }
  });
}
