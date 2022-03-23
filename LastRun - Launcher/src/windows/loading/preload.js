const { ipcRenderer } = require('electron');

window.addEventListener('load', () => {
    ipcRenderer.send('loading:ready');

    const LOADING_STATUS = document.getElementById('LOADING-STATUS');
    const LOADING_BAR = document.getElementById('LOADING-BAR');

    ipcRenderer.addListener('status:looking', () => {
        LOADING_STATUS.textContent = 'Looking for updates...';
    });

    ipcRenderer.addListener('status:available', () => {
        LOADING_STATUS.textContent = 'Update available';
    });

    ipcRenderer.addListener('status:restarting', () => {
        LOADING_STATUS.textContent = 'Finalizing...';
    });

    ipcRenderer.addListener('status:development', () => {
        LOADING_STATUS.textContent = 'Development mode...';
    });

    ipcRenderer.addListener('status:process', (event, data) => {
        if(data == null) return;

        /* data will contain the following info.
            data.progress: Number,
            data.speed: String,
            data.transfered: Number,
            data,total: Number
        */

        const percentage = data.progress / 100;
        
        LOADING_BAR.style.transform = `scaleX(${percentage})`;
        LOADING_BAR.style.transition = 'transform 2s ease-in-out';
    });
});