const img = new Image;
img.src = './flatboy-walk2.png'
/* 307 x 251  */

const aitaimg = new Image;
aitaimg.src = 'aita-80.png';
/* 142 x 80 */

const painovoima = 1;

let canvas, ctx, check = 0, draw = true, pelaaja, aika;
let debug = false;

/* let aita; */
let aidat = [];

const hyppynappi = {
    painettu: false
}

class Pelaaja {
    constructor() {
        this.animFrameja = img.width / 307;
        this.nykyinenFrame = 0;
        this.leveys = img.width / this.animFrameja;
        this.korkeus = img.height;
        this.yOffset = 15
        this.paikka = {
            x: canvas.width / 2 - this.leveys / 2,
            y: canvas.height - this.korkeus - this.yOffset
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
        this.nykyinenFrame = (this.nykyinenFrame < this.animFrameja-1) ? this.nykyinenFrame += 1 : 0;
    }

    paivita() {
        this.piirra();
        if (debug) {
            if (document.querySelector('#debugger').style.display == 'none') {
                document.querySelector('#debugger').style.display = 'block';
            }
            debuggaus();
        } else {
            if (document.querySelector('#debugger').style.display == 'block') {
                document.querySelector('#debugger').style.display = 'none';
            }
        }
        this.paikka.y += this.nopeus.y;
        if (this.paikka.y + this.korkeus + this.nopeus.y < canvas.height - this.yOffset) {
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
    constructor(x) {
        this.yOffset = 24;
        this.paikka = {
            x: x,
            y: canvas.height - aitaimg.height - this.yOffset
        }
        this.pituus = aitaimg.width;
        this.korkeus = aitaimg.height;
    }

    piirra() {
        /*
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.paikka.x, this.paikka.y, this.pituus, this.korkeus);
        */
       /*
        ctx.drawImage(aitaimg,
            0,
            0,
            aitaimg.width,
            aitaimg.height,
            this.paikka.x,
            this.paikka.y,
            this.pituus,
            this.korkeus); 
        */
       ctx.drawImage(aitaimg,this.paikka.x, this.paikka.y);
    }
}

function debuggaus() {
    document.querySelector('#ypaikka').innerText = pelaaja.paikka.y;
    document.querySelector('#ynopeus').innerText = pelaaja.nopeus.y;
    let lakipiste = (pelaaja.lakipisteSaavutettu == false) ? 'Ei' : 'Kyllä';
    document.querySelector('#lakipiste').innerText = lakipiste;
    document.querySelector('#xpaikka').innerText = pelaaja.paikka.x;
    document.querySelector('#xnopeus').innerText = pelaaja.nopeus.x;
    document.querySelector('#ftime').innerText = Math.ceil(1000 / (Date.now() - aika));
    aika = Date.now();
}

window.onload = () => {
    canvas = document.querySelector('#kanvas');
    ctx = canvas.getContext("2d");

    pelaaja = new Pelaaja();
    /*
    aidat = [new Aita(1000), new Aita(1000+139)]
    */

    for (let i=0;i<10;i++) {
        aidat.push(new Aita(1200+i*139))
    }

    /* kävelynopeus = 2 */
    pelaaja.nopeus.x = 2;
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
        /*
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(0,0,canvas.width,canvas.height)
        */

        ctx.clearRect(0,0,canvas.width,canvas.height);

        const radi = ctx.createLinearGradient(0,canvas.height-50,0,canvas.height);
        radi.addColorStop(0,'#e5a029'); /* #e5a029 */
        radi.addColorStop(1,'#e9aa45'); /* #e9aa45 */ /* #f3ce97 */
        ctx.fillStyle = radi;
        ctx.fillRect(0,canvas.height-50,canvas.width,50);

        aidat.forEach(aita => {
            aita.piirra();
            aita.paikka.x -= pelaaja.nopeus.x;
        });
 
        /* aita.piirra(); */
       /* piirrä pelaaja */
        pelaaja.paivita();

 

        /* seuraavalla "kierroksella" ei piirretä */
        draw = false;
    } else draw = true; /* piirrä seuraavalla kerralla */
}