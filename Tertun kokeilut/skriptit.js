const img = new Image();
img.src = './Dino_seisoo_10.png';

const aitaImg = new Image();
aitaImg.src = 'tiiliaita.png';

const puuImg = new Image();
puuImg.src = 'puut.png';

const lintuImg = new Image();
lintuImg.src = 'linnunlento9.png';

const lintuImg2 = new Image();
lintuImg2.src = 'mustatLinnut.png';

const painovoima = 1;

let canvas, ctx, check = 0, draw = true, pelaaja, aita, puu, lintu, lintu2, puu2, tausta;

const hyppynappi = {
    painettu: false
};
/* 307 x 251  */

class Pelaaja {
    constructor() {
        this.animFrameja = 10;
        this.nykyinenFrame = 0;
        this.leveys = img.width / this.animFrameja;
        this.korkeus = img.height;
        this.paikka = {
            x: canvas.width / 2 - this.leveys / 2,
            y: canvas.height - (this.korkeus - 50)
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
            this.nykyinenFrame * this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys - (this.leveys/4),
            this.korkeus - (this.korkeus/4));
        this.nykyinenFrame = (this.nykyinenFrame < 9) ? this.nykyinenFrame += 1 : 0;
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

class Lintu {
    constructor() {
        this.animFrameja = 9; // Vaihda tason määrä
        this.nykyinenFrame = 0;
        this.leveys = lintuImg.width / this.animFrameja;
        this.korkeus = 540; // Pienennetty korkeus
        this.paikka = {
            x: -170,  // Aseta linnun alku sivun vasempaan reunaan
            y: canvas.height - this.korkeus
        };
        this.nopeus = {
            x: 20,  // Aseta linnun vaakasuuntainen nopeus
            y: 0
        };
    }

    piirra() {
        ctx.drawImage(lintuImg,
            this.nykyinenFrame * this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys,
            this.korkeus);
        this.nykyinenFrame = (this.nykyinenFrame < this.animFrameja - 1) ? this.nykyinenFrame += 1 : 0;
    }

    liiku() {
        // Vaakasuuntainen liike
        this.paikka.x += this.nopeus.x;

        // Tarkista, onko lintu mennyt näytön oikean reunan yli, ja aseta se näytön alkuun
        if (this.paikka.x + this.leveys > canvas.width +150) {
            this.paikka.x = 0;
        }
    }

    paivita() {
        this.piirra();
        this.liiku();
    }
}

class Lintu2 {
    constructor() {
        this.animFrameja = 16; // Vaihda tason määrä
        this.nykyinenFrame = 0;
        this.leveys = lintuImg2.width / this.animFrameja;
        this.korkeus = 590; // Pienennetty korkeus
        this.paikka = {
            x: -210,  // Aseta linnun alku sivun vasempaan reunaan
            y: canvas.height - this.korkeus
        };
        this.nopeus = {
            x: 20,  // Aseta linnun vaakasuuntainen nopeus
            y: 0
        };
    }

    piirra() {
        ctx.drawImage(lintuImg2,
            this.nykyinenFrame * this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys / 2,
            this.korkeus / 2);
        this.nykyinenFrame = (this.nykyinenFrame < this.animFrameja - 1) ? this.nykyinenFrame += 1 : 0;
    }

    liiku() {
        // Vaakasuuntainen liike
        this.paikka.x += this.nopeus.x;

        // Tarkista, onko lintu mennyt näytön oikean reunan yli, ja aseta se näytön alkuun
        if (this.paikka.x + this.leveys > canvas.width +150) {
            this.paikka.x = 0;
        }
    }

    paivita() {
        this.piirra();
        this.liiku();
    }
}

class Aita {
    constructor(x, korkeus, leveys, nopeus) {
        this.x = x;
        this.korkeus = korkeus;
        this.leveys = leveys;
        this.nopeus = nopeus;

        this.aidat = [];
        this.luoAita();
    }

    luoAita() {
        let x = this.x;

        while (x < canvas.width) {
            this.aidat.push({ x: x, korkeus:150});
            x += this.leveys;
        }
    }

    liiku() {
        // Siirrä kaikkia aitaelementtejä
        for (let i = 0; i < this.aidat.length; i++) {
            this.aidat[i].x -= this.nopeus;
        }
    
        // Tarkista, onko ensimmäinen aitaelementti kokonaan näytön vasemman reunan ulkopuolella
        if (this.aidat.length > 0 && this.aidat[0].x + this.leveys <= 0) {
            // Poista ensimmäinen aitaelementti
            this.aidat.shift();
        }
    
        // Lisää uusi aitaelementti näytön oikeaan reunaan
        this.aidat.push({
            x: this.aidat[this.aidat.length - 1].x + this.leveys,
            korkeus: 150
        });
    }

    piirra() {
        for (let i = 0; i < this.aidat.length; i++) {
            ctx.drawImage(aitaImg, this.aidat[i].x, canvas.height - this.aidat[i].korkeus -20, this.leveys, this.aidat[i].korkeus);
        }
    }
}  
  
class Puu {
    constructor() {
        this.img = new Image();
        this.img.src = 'puut.png'; // Korvaa tämä puun kuvatiedoston polulla
        this.x = canvas.width; // Alustetaan x-koordinaatti näytön oikeaan reunaan
        
    }

    liiku() {
        this.x -= 6; // Tämä on esimerkki, muuta tarpeen mukaan
        if (this.x + this.img.width <= 0) {
            this.x = canvas.width; // Asetetaan takaisin näytön oikeaan reunaan
        }
    }
    piirra() {
        ctx.drawImage(this.img, this.x, canvas.height - this.img.height -30, this.img.width, this.img.height);
    }
}

class Puu_rivi {
    constructor() {
        this.img = new Image();
        this.img.src = 'puut.png'; // Korvaa tämä puun kuvatiedoston polulla
        this.korkeus = 300; // Pienennetty korkeus
        this.leveys = 700; // Pienennetty leveys
        this.x = canvas.width;
        this.y = canvas.height - this.korkeus - 20; // Aseta ylemmäs
    }

    liiku() {
        this.x -= 2; // Tämä on esimerkki, muuta tarpeen mukaan
        if (this.x + this.leveys <= 0) {
            this.x = canvas.width; // Asetetaan takaisin näytön oikeaan reunaan
        }
    }

    piirra() {
        ctx.drawImage(this.img, this.x, this.y -100, this.leveys, this.korkeus);
    }
}

class Tausta {
    constructor() {
        this.img = new Image();
        this.img.src = 'taustaLinnut4.png'; // Korvaa tämä taustakuvan polulla
        this.x = 0;
        this.y = 0;
        this.nopeus = 2; // Säädä nopeutta tarpeen mukaan
    }

    liiku() {
        this.x -= this.nopeus;
        if (this.x <= -canvas.width) {
            this.x = 0;
        }
    }

    piirra() {
        ctx.drawImage(this.img, this.x, this.y, canvas.width, canvas.height);
        ctx.drawImage(this.img, this.x + canvas.width, this.y, canvas.width, canvas.height);
    }
}

function debug() {
    document.querySelector('#ypaikka').innerText = pelaaja.paikka.y;
    document.querySelector('#ynopeus').innerText = pelaaja.nopeus.y;
    let lakipiste = (pelaaja.lakipisteSaavutettu == false) ? 'Ei' : 'Kyllä';
    document.querySelector('#lakipiste').innerText = lakipiste;
}

function animoi() {
    if (draw) { 
        // piirretään vain joka toinen kerta
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        tausta.liiku();
        tausta.piirra();
        lintu2.liiku();
        lintu2.piirra();
        lintu.liiku();
        lintu.piirra();
        //ctx.drawImage(puuImg, 0, 150, canvas.width, canvas.height - img.height);
        puu2.liiku();
        puu2.piirra();
        puu.liiku(); // Liikuta puuta ennen sen piirtämistä
        puu.piirra();
        aita.liiku();
        aita.piirra();
        pelaaja.paivita();
    }

    if (draw) {
        // aseta uusi animaatiokutsu, jos piirretään
        window.requestAnimationFrame(animoi);
    } else {
        // aseta viive, jos ei piirretä
        setTimeout(() => {
            animoi();
        }, 100); // Viive 100 millisekuntia
    }
        // vaihdetaan seuraavalla kierroksella
    draw = !draw;
}

window.onload = () => {
    canvas = document.querySelector('#kanvas');
    ctx = canvas.getContext("2d");
    tausta = new Tausta();
    pelaaja = new Pelaaja();
    aita = new Aita(0, 80, 150, 2);
    puu = new Puu(); // Tässä luodaan puu
    puu2 = new Puu_rivi();
    lintu = new Lintu();
    lintu2 = new Lintu2();

    animoi();

    window.addEventListener('keydown', (eve) => {
        if (eve.key == 'ArrowUp' || eve.code == 'ArrowUp') {
            if (pelaaja.voiHypata) pelaaja.nopeus.y = -15;
        }
    });

}