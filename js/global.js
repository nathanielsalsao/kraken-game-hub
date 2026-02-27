
function updateTime() {
    const timeElement = document.getElementById('system-time');
    if (timeElement) {
        const now = new Date();
        timeElement.innerText = now.toLocaleTimeString('en-GB');
    }
}
setInterval(updateTime, 1000);
updateTime();


function lockVault() {
    const overlay = document.getElementById('warning-overlay');
    overlay.style.display = 'flex';
    setTimeout(() => {
        window.location.href = 'login.html'; 
    }, 800);
}

const canvas = document.getElementById('canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, columns;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        columns = Math.floor(width / 20);
    }

    window.onresize = resize;
    resize();

    const drops = new Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(0, 4, 10, 0.1)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#00f2ff';
        ctx.font = '15px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = String.fromCharCode(Math.random() * 128);
            ctx.fillText(text, i * 20, drops[i] * 20);
            if (drops[i] * 20 > height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 50);
}

function lockVault() {
    const overlay = document.getElementById('warning-overlay');
    const mainBody = document.body;
    const sidebar = document.getElementById('sidebar');
    const topbar = document.getElementById('top-bar');


    if (overlay) overlay.style.display = 'flex';


    setTimeout(() => {
   
        document.getElementById('main-content').classList.add('fade-out-ui');
        if (sidebar) sidebar.classList.add('fade-out-ui');
        if (topbar) topbar.classList.add('fade-out-ui');
        

        setTimeout(() => {
            window.location.href = 'start.html'; 
        }, 1200);
    }, 800);
}
function toggleProfile() {
    document.getElementById('profile-panel').classList.toggle('active');
}

function saveProfile() {
    const newName = document.getElementById('edit-name').value;
    if (newName) {

        document.getElementById('display-name').innerText = newName.toUpperCase();
        document.querySelector('.user-avatar').innerText = newName.substring(0, 2).toUpperCase();
        
 
        localStorage.setItem('kraken_username', newName);
        

        toggleProfile();
        

        console.log("IDENTITY_UPDATED: " + newName);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('kraken_username');
    if (savedName) {
        document.getElementById('display-name').innerText = savedName.toUpperCase();
        document.querySelector('.user-avatar').innerText = savedName.substring(0, 2).toUpperCase();
        document.getElementById('edit-name').value = savedName;
    }
});