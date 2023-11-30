let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let kuvatKaytettavissa = [false], aloitusajat = [0], d = new Date();

// Tautakuvat
const taustakuvat = new Image();
taustakuvat.src = '../kuvat/taustat.png';

// Odotetaan että sivu on latautunut ja kaikki sen resurssit on latautunut
window.onload = () => {
    document.getElementById('odota').style.display = 'none';
    document.getElementById('kanvaasi').style.opacity = 1;

    animoi();
}

// Canvasin animointi
function animoi(aika) {
    // Kutsutaan tätä samaa funktiota ennen seuraavaa ruudun "maalausta"
    window.requestAnimationFrame(animoi);
    
    // Koska ruudunpäivitysnopeus on yleensä 60Hz tai suurempi, rajoitetaan ruudun 
    // piirtämistä n. 30 kertaan sekunnissa että animaatiot eivät pyöri liian nopeasti
    let fps = Math.round(1000 / (aika-vanhaAika));
    if (Number.isInteger(fps)) {
        if (fps <= 30) { /* max. 30 fps */
            vanhaAika = aika;
            // Kaikki piirtäminen tämän jälkeen


        }
    }
}