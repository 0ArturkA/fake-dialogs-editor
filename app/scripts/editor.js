const { ipcRenderer } = require('electron');
const fs = require('fs');

const dialogsData = JSON.parse(localStorage.getItem('dialogsData'));
const usersList = JSON.parse(localStorage.getItem('usersList'));

if (!dialogsData.dialogs && !dialogsData.dialogs.length) {
    console.error('Dialogs data not found on global');
    alert('Dialog data not found');
    ipcRenderer.send('loadPage', 'main.html');
}

if (!usersList) {
    console.error('Users data not found on global');
    alert('Users data not found');
    ipcRenderer.send('loadPage', 'main.html');
}

// Add users
for (const user of usersList) {
    document.getElementById('usersList').innerHTML += `
        <a class="item">
            <img class="ui avatar image" src="${user.image}">
            ${user.name}
        </a>
    `;
}

// Set path
document.getElementById('filePath').innerText = dialogsData.path;

// Build dialogs
for (const dIndex in dialogsData.dialogs) {
    const dialog = dialogsData.dialogs[dIndex];

    // Create dialog container
    const dialogContainerElement = document.createElement('div');
    dialogContainerElement.className = 'dialog';

    const dialogAttr = document.createAttribute('data-dialog');
    dialogAttr.value = dIndex;
    dialogContainerElement.setAttributeNode(dialogAttr);

    // Add dialog container to list
    document.getElementById('dialogsList').appendChild(dialogContainerElement);

    // Create dialog element
    const dialogElement = document.createElement('div');
    dialogElement.className = 'ui minimal threaded comments';

    // Each messages
    for (const mIndex in dialog) {
        const message = dialog[mIndex];
        const user = usersList[message.userIndex];

        if (!user) {
            console.error(`User with ${message.userIndex} index nto found on users array`);
            alert(`User with ${message.userIndex} not found`);
            break;
        }

        if (mIndex == 0 && !!message.replyMessageIndex) {
            console.error(`First message on dialog with ${dIndex} index have "replyMessageIndex"`);
            alert(`First message on dialog with ${dIndex} index have "replyMessageIndex"`);
            break;
        }

        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'comment';

        const messageAttr = document.createAttribute('data-message');
        messageAttr.value = mIndex;
        messageElement.setAttributeNode(messageAttr);

        messageElement.innerHTML = `
            <a class="avatar">
                <img src="${user.image}">
            </a>
            <div class="content">
                <a class="author">${user.name}</a>
                <div class="text">${message.text}</div>
                <div class="actions">
                    <a class="removeMessage">
                        <i class="close icon"></i>
                        Remove
                    </a>
                    <a class="addReply">
                        <i class="plus icon"></i>
                        Reply
                    </a>
                </div>
            </div>
        `;

        // Check for replies
        if (message.replyMessageIndex !== undefined) {
            // Find message to reply
            const messages = document.querySelectorAll(`[data-dialog="${dIndex}"] div[data-message="${message.replyMessageIndex}"]`);
            
            if (!messages.length) {
                console.warn(`Message with ${message.replyMessageIndex} index for reply in dialog with ${dIndex} not found`);
                alert(`Message with ${message.replyMessageIndex} index for reply in dialog with ${dIndex} not found`);
                continue;
            }

            // Find exist reply container
            const replyContainer = messages[0].getElementsByClassName('comments')[0];
            if (!replyContainer) {
                // Create reply container
                const replyContainer = document.createElement('div');
                replyContainer.className = 'comments';
                replyContainer.appendChild(messageElement)
                
                messages[0].appendChild(replyContainer);
            } else {
                // Add to exist reply container
                replyContainer.appendChild(messageElement);
            }
        } else {
            // Add first message
            dialogElement.appendChild(messageElement)
        }

        // Add dialog element to dialog container
        dialogContainerElement.appendChild(dialogElement);
    }

    // Add divider to end
    dialogContainerElement.innerHTML += '<div class="ui divider"></div>';
}

// Return to main menu
document.getElementById('returnToMainMenu').addEventListener('click', () => {
    ipcRenderer.send('loadPage', 'main.html');
});

// Save changes
document.getElementById('saveChanges').addEventListener('click', () => {
    fs.writeFile(dialogsData.path, JSON.stringify(dialogsData.dialogs), err => {
        if (err) {
            console.error('Saving dialogs file error', err.message);
            alert('Saving dialogs file error', err.message);
            return;
        }

        alert('Success saved');
    });
});

// Remove message
for (const elem of document.getElementsByClassName('removeMessage')) {
    elem.addEventListener('click', function() {
        const dIndex = parseInt(this.closest('.dialog').dataset.dialog);
        const mIndex = parseInt(this.closest('.comment').dataset.message);

        // Mark dependent messages for delete
        let i = dialogsData.dialogs[dIndex].length - 1;
        let haveDependencies = true;
        let curDependenciesId = mIndex;
        let nextDependenciesId;
        let markedForDeleteIndexes = [];
        while (haveDependencies) {
            const messageDependencies = dialogsData.dialogs[dIndex][i].replyMessageIndex;

            if (messageDependencies === undefined) return;

            if (messageDependencies === curDependenciesId) {
                nextDependenciesId = i;
                markedForDeleteIndexes.push(i);
            }

            i--;

            if (i === 0) {
                if (curDependenciesId === nextDependenciesId) {
                    haveDependencies = false;
                } else {
                    curDependenciesId = nextDependenciesId;
                    i = dialogsData.dialogs[dIndex].length - 1;
                }
            }
        }

        // Delete dependencies
        markedForDeleteIndexes.sort();
        let deletedIndexCount = 0;
        for (const index of markedForDeleteIndexes) {
            dialogsData.dialogs[dIndex].splice(index - deletedIndexCount, 1);
            deletedIndexCount++;
        }

        // Delete main message
        dialogsData.dialogs[dIndex].splice(mIndex, 1);
        this.closest('.comment').remove();        

        // Delete empty array
        if (dialogsData.dialogs[dIndex].length === 0) {
            dialogsData.dialogs.splice(dIndex, 1);
            document.querySelectorAll(`[data-dialog="${dIndex}"]`)[0].remove();

            // Update dialogs indexes
            for (const elem of document.querySelectorAll('.dialog')) {
                let curIndex = elem.getAttribute('data-dialog');
                if (curIndex < dIndex) continue; 
                elem.setAttribute('data-dialog', --curIndex);
            }
        }
    });
}

// Add reply
for (const elem of document.getElementsByClassName('addReply')) {
    const replyForm = document.createElement('form');
    replyForm.className = 'ui reply tiny form';
    replyForm.innerHTML = `
        <div class="field">
            <input type="text" placeholder="Message text...">
        </div>
        <button class="ui primary tiny submit labeled icon button" type="submit">
            <i class="icon edit"></i> Add Reply
        </button>
    `;

    elem.addEventListener('click', function() {
        const dIndex = parseInt(this.closest('.dialog').dataset.dialog);
        const mIndex = parseInt(this.closest('.comment').dataset.message);

        // Find message
        const message = document.querySelectorAll(`[data-dialog="${dIndex}"] div[data-message="${mIndex}"]`)[0];

        // Add active class to reply action
        elem.classList.add('active');
        
        // Show reply form
        const form = message.appendChild(replyForm);

        // Handle form submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const text = this.querySelector('input').value;

            if (!text) {
                console.warn('Reply text cant be empty');
                alert('Reply text cant be empty');
                return;
            }

            // TODO: Show sidebar
            // TODO: Add select user image & name
            // TODO: Fix reply add to "comments" div

            // Create reply message element
            const messageElement = document.createElement('div');
            messageElement.className = 'comment';

            const messageAttr = document.createAttribute('data-message');
            messageAttr.value = mIndex + 1;
            messageElement.setAttributeNode(messageAttr);

            messageElement.innerHTML = `
                <a class="avatar">
                    <img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/42/42d7a36ecb7595fd6d1bdc4c8d8c05aafd498581_full.jpg">
                </a>
                <div class="content">
                    <a class="author">NightOwl</a>
                    <div class="text">${text}</div>
                    <div class="actions">
                        <a class="removeMessage">
                            <i class="close icon"></i>
                            Remove
                        </a>
                        <a class="addReply">
                            <i class="plus icon"></i>
                            Reply
                        </a>
                    </div>
                </div>
            `;

            // Add reply
            message.parentNode.insertBefore(messageElement, message.nextSibling);

            // Remove active class to reply action
            elem.classList.remove('active');

            // Remove form
            form.remove();
        });
    });
}