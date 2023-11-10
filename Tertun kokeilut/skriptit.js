const img = new Image;
img.src = './kissa-kavelee.png';


const aitaImg = new Image;
aitaImg.src = 'aita-80.png';


const painovoima = 1;

let canvas, ctx, check = 0, draw = true, pelaaja, aita;



const hyppynappi = {
    painettu: false
};
/* 307 x 251  */

class Pelaaja {
    constructor() {
        this.animFrameja = 15;
        this.nykyinenFrame = 0;
        this.leveys = img.width / this.animFrameja;
        this.korkeus = img.height;
        this.paikka = {
            x: canvas.width / 3 - this.leveys / 2,
            y: canvas.height - this.korkeus
        };
        this.nopeus = {
            x: 0,
            y: 0
        };
        this.voiHypata = true
        this.lakipisteSaavutettu = false
    }

    piirra() {
        ctx.drawImage(img,
            this.nykyinenFrame*this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys,
            this.korkeus);
        this.nykyinenFrame = (this.nykyinenFrame < 14) ? this.nykyinenFrame += 1 : 0;
    }

    paivita() {
        this.piirra();
        debug();
        this.paikka.y += this.nopeus.y;
        if (this.paikka.y + this.korkeus + this.nopeus.y < canvas.height) {
            if (this.nopeus.y < 0 && this.nopeus.y + painovoima >= 0) this.lakipisteSaavutettu = true;
            this.nopeus.y += painovoima;
            this.voiHypata = false;
        } else {
            this.nopeus.y = 0;
            this.voiHypata = true;
            this.lakipisteSaavutettu = false;
        }
    }
}

class Aita {
    constructor(x, korkeus, leveys, nopeus) {
        this.x = x;
        this.korkeus = korkeus;
        this.leveys = leveys;
        this.nopeus = nopeus;
    }

    piirra() {
        ctx.drawImage(
            aitaImg, this.x,
            canvas.height - this.korkeus,
            this.leveys, this.korkeus
        );
    }

    liiku() {
        this.x += this.nopeus;

        if (this.x > canvas.width) {
            this.x = -this.leveys; // Asetetaan aita takaisin näytön alkuun
        }
    }
}

function debug() {
    document.querySelector('#ypaikka').innerText = pelaaja.paikka.y;
    document.querySelector('#ynopeus').innerText = pelaaja.nopeus.y;
    let lakipiste = (pelaaja.lakipisteSaavutettu == false) ? 'Ei' : 'Kyllä';
    document.querySelector('#lakipiste').innerText = lakipiste;
}

/*function animoi() {
    window.requestAnimationFrame(animoi);
    if (draw) { /* piirretään vain joka toinen kerta */
        /* tyhjennä tausta */
    //ctx.clearRect(0, 0, canvas.width, canvas.height); //tästä poistettu paririviä joiden tilalle tämä

    /* piirrä pelaaja */
    //pelaaja.paivita();
        /* seuraavalla "kierroksella" ei piirretä */
        draw = false;
    //} else draw = true; /* piirrä seuraavalla kerralla */
//}


function animoi() {
    if (draw) { 
        // piirretään vain joka toinen kerta
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pelaaja.paivita();
        aita.liiku();
        aita.piirra();

    }
    // vaihdetaan seuraavalla kierroksella
    draw = !draw;

    if (draw) {
        // aseta uusi animaatiokutsu, jos piirretään
        window.requestAnimationFrame(animoi);
    } else {
        // aseta viive, jos ei piirretä
        setTimeout(() => {
            animoi();
        }, 100); // Viive 100 millisekuntia
    }
}

window.onload = () => {
    canvas = document.querySelector('#kanvas');
    ctx = canvas.getContext("2d");

    pelaaja = new Pelaaja();
    aita = new Aita(0, 100, 150, 2);
    animoi();


    window.addEventListener('keydown', (eve) => {
        if (eve.key == 'ArrowUp' || eve.code == 'ArrowUp') {
            if (pelaaja.voiHypata) pelaaja.nopeus.y = -15;
        }
    });
};
