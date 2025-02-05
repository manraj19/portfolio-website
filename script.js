//HAMBURGER MENU
function toggleMenu(){
    const menu = document.querySelector('.menu-links');
    const icon = document.querySelector('.hamburger-icon');
    menu.classList.toggle('open');
    icon.classList.toggle('open');
}

//AUTOMATIC TEXT
const textArray = ["Software Programmer", "Student", "Cricket Lover", "Tech Enthusiast", "Chess Aficionado"];
let index = 0;

function changeText() {
    index = (index + 1) % textArray.length;
    document.getElementById("changing-text").textContent = textArray[index];
}

setInterval(changeText, 1500);