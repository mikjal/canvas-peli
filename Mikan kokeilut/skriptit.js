const img = new Image;
img.src = './flatboy-sprites.png'

const painovoima = 1;

let canvas, ctx, check = 0, draw = true, pelaaja;

const hyppynappi = {
    painettu: false
}

/* 307 x 251  */

class Pelaaja {
    constructor() {
        this.animFrameja = 15;
        this.nykyinenFrame = 0;
        this.leveys = img.width / this.animFrameja;
        this.korkeus = img.height;
        this.paikka = {
            x: canvas.width / 2 - this.leveys / 2,
            y: canvas.height - this.korkeus
        }
        this.nopeus = {
            x: 0,
            y: 0
        }
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

function debug() {
    document.querySelector('#ypaikka').innerText = pelaaja.paikka.y;
    document.querySelector('#ynopeus').innerText = pelaaja.nopeus.y;
    let lakipiste = (pelaaja.lakipisteSaavutettu == false) ? 'Ei' : 'Kyllä';
    document.querySelector('#lakipiste').innerText = lakipiste;
}

window.onload = () => {
    canvas = document.querySelector('#kanvas');
    ctx = canvas.getContext("2d");

    pelaaja = new Pelaaja();
    animoi();

    window.addEventListener('keydown', (eve) => {
        if (eve.key == 'ArrowUp' || eve.code == 'ArrowUp') {
            /* vain yksi hyppy kerralla, ei voi tehdä toista hyppyä kun edellinen hyppy on menossa */
            if (pelaaja.voiHypata) pelaaja.nopeus.y = -15;
        }
    })

}


function animoi() {
    window.requestAnimationFrame(animoi);
    if (draw) { /* piirretään vain joka toinen kerta */
        /* tyhjennä tausta */
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(0,0,canvas.width,canvas.height)
        /* piirrä pelaaja */
        pelaaja.paivita();
        /* seuraavalla "kierroksella" ei piirretä */
        draw = false;
    } else draw = true; /* piirrä seuraavalla kerralla */
}