const { dialog } = require('electron').remote;
const { ipcRenderer } = require('electron');
const fs = require('fs');
const store = require('../store');

const defaultDialogs = require('../defaults/dialogs.json');
const defaultUsers = require('../defaults/users.json');

// Fake users list
const fakeUsersListPath = store.get('fakeUsersListPath');
if (fakeUsersListPath) {
    fs.readFile(fakeUsersListPath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Opening fake users file error', err.message);
            alert('Opening dialog error', err.message);
            return;
        }

        validateFakeUsersListFile(data.toString());
    });
} else {
    localStorage.setItem('usersList', JSON.stringify(defaultUsers));
    document.getElementById('fakeUsersListPath').value = 'Default';
}

// Handle checkbox example dialogs
if (store.get('createWithExample')) {
    document.getElementById('addDialogExample').checked = true;
}

document.getElementById('addDialogExample').addEventListener('change', function() {
    if (this.checked) {
        store.set('createWithExample', true);
    } else {
        store.set('createWithExample', false);
    }
});

// Open fake users list
document.getElementById('selectFakeUsersListPath').addEventListener('click', () => {
    dialog.showOpenDialog({
        title: 'Открыть существующий список фейк пользователей',
        filters: [
            { name: 'JSON', extensions: ['json'] }
        ]
    }, filename => {
        if (!filename) {
            console.log('User cancel open dialog for opening file');
            return;
        }

        fs.readFile(filename[0], 'utf-8', (err, data) => {
            if (err) {
                console.error('Opening fake users file error', err.message);
                alert('Opening dialog error', err.message);
                return;
            }

            validateFakeUsersListFile(data.toString(), filename[0]);
        });
    });
});

// Create new dialogs file
document.getElementById('createDialogFile').addEventListener('click', () => {
    dialog.showSaveDialog({
        title: 'Создать новый диалог',
        defaultPath: '~/newDialog.json',
        filters: [
            { name: 'JSON', extensions: ['json'] }
        ]
    }, filename => {
        if (!filename) {
            console.log('User cancel save dialog for creating new file');
            return;
        }

        // Add example
        let dialogs = [];
        if (store.get('createWithExample')) {
            dialogs = defaultDialogs;
        }

        console.log('create new file')
        fs.writeFile(filename, JSON.stringify(dialogs), err => {
            if (err) {
                console.error('Creating new dialogs file error', err.message);
                alert('Create dialog error', err.message);
                return;
            }

            localStorage.setItem('dialogsData', JSON.stringify({
                path: filename,
                dialogs,
            }));
            ipcRenderer.send('loadPage', 'editor.html');
        });
    });
});

// Open dialogs file
document.getElementById('openDialogFile').addEventListener('click', () => {
    dialog.showOpenDialog({
        title: 'Открыть существующий диалог',
        filters: [
            { name: 'JSON', extensions: ['json'] }
        ]
    }, filename => {
        if (!filename) {
            console.log('User cancel open dialog for opening file');
            return;
        }

        fs.readFile(filename[0], (err, data) => {
            if (err) {
                console.error('Opening new dialogs file error', err.message);
                alert('Opening dialog error', err.message);
                return;
            }

            try {
                const dialogs = JSON.parse(data.toString());
                localStorage.setItem('dialogsData', JSON.stringify({
                    path: filename[0],
                    dialogs,
                }));
                ipcRenderer.send('loadPage', 'editor.html');
            } catch (err) {
                console.error('JSON parse dialogs data error', err.message);
                alert('Open dialogs file error', err.message);
            }
        });
    });
});

function validateFakeUsersListFile(rawData, path) {
    try {
        const data = JSON.parse(rawData);

        for (const user of data) {
            if (!user.name) {
                throw new Error('one of the users not found name field');
            }

            if (!user.image) {
                throw new Error('one of the users not found image field');
            }
        }

        localStorage.setItem('usersList', JSON.stringify(data));
        document.getElementById('fakeUsersListPath').value = path;
        store.set('fakeUsersListPath', path);
    } catch (err) {
        console.error('Validate error', err.message);
        alert('Validate fake users list error', err.message);

        // User default
        localStorage.setItem('usersList', JSON.stringify(defaultUsers));
        document.getElementById('fakeUsersListPath').value = 'Default';
        store.set('fakeUsersListPath', null);

        return;
    }
}