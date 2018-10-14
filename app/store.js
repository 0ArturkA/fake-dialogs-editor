const electron = require('electron');
const path = require('path');
const fs = require('fs');

const defaultConfig = require('./defaults/config.json');

const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const configPath = path.join(userDataPath, 'user-preferences.json');
const configData = parseDataFile(configPath, defaultConfig);

module.exports.get = key => {
    return configData[key];
}

module.exports.set = (key, val) => {
    configData[key] = val;

    try {
        fs.writeFileSync(configPath, JSON.stringify(configData));
    } catch (err) {
        console.error('Saving config changes error', err.message);
        alert('Save config error', err.message);
    }
}

function parseDataFile(path, defaults) {
    try {
        return JSON.parse(fs.readFileSync(path));
    } catch (err) {
        return defaults;
    }
}