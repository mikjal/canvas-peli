const canvas = document.querySelector('#kanvaasi');
const ctx = canvas.getContext("2d");
const canwidth = canvas.width, canheight = canvas.height;


let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let pistemaara = 0, pistelisays = 50, painovoima = 0.5, hahmoid = 0;
let tila = 'a'; // a = aloitusruutu, o = ohjeet, p = peli käynnissä, g = game over
let touch = false; // tukeeko laite kosketusta?
let aidat = []; // Aita-luokan oliot
let hennyOK = false, abelOK = false, fontOK = false, audioOK = false, lopputeksti = '', naytaOhjeet = true, debug = false;
const musiikki = new Audio();

musiikki.oncanplaythrough = () => {
    audioOK = true;
}
musiikki.autoplay = false;
musiikki.src = '../musiikki/digital-love-reduced-bitrate.mp3';

// Taustakuvat
const taustakuvat = new Image();
taustakuvat.src = '../kuvat/taustat.png';

const lintuImg2 = new Image();
lintuImg2.onload = () =>{
    console.log('lintu2 tiedosto ladattu')
}
lintuImg2.onerror = function() {
    console.error('Virhe kuvaa ladattaessa:', lintuImg2.src);
}
lintuImg2.src = '../kuvat/mustatLinnut2.png';

let taustat = [], lintu2 // taustakuvia varten

// Fontit
const hennyFontti = new FontFace('Henny Penny','url(https://fonts.gstatic.com/s/hennypenny/v17/wXKvE3UZookzsxz_kjGSfPQtvXI.woff2)');
const abelFontti = new FontFace('Abel','url(https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2)');

hennyFontti.load().then(() => {
    document.fonts.add(hennyFontti);
    hennyOK = true;
}, (err) => {
    console.log(err);
},
);

// Fontti tekstiin Terttu ja Mika esittävät pelin
const rowdiesFontti = new FontFace('Rowdies', 'url(https://fonts.gstatic.com/s/rowdies/v17/ptRJTieMYPNBAK21_rBDwQ.woff2)');

rowdiesFontti.load().then(() => {
  document.fonts.add(rowdiesFontti);
  fontOK = true;
}, (err) => {
    console.log(err);
} 
);

abelFontti.load().then(() => {
    document.fonts.add(abelFontti);
    abelOK = true;
}, (err) => {
    console.log(err);
}
);

function rakennaHaive() {
    let alku = new Array(40).fill(0), loppu = [], keskikohta = new Array(30*5).fill(1);
    let p = 1;
    for (let i=0; i<1; i += 0.1) {
        for (let maara=0; maara < 2; maara++) {
            alku.push(Math.round(i*100) / 100);
            loppu.push(Math.round(p*100) / 100)
        }
        p -= 0.1;
    }
    for (let i=0; i<20; i++) loppu.push(0);
    return alku.concat(keskikohta,loppu);
}

const haive = rakennaHaive();

// Hahmojen mukaiset tiedot
const hahmot = [
    // poika
    {
        kuvatiedosto: '../kuvat/poika.png', // tiedostonimi
        animaatioFrameja: 15, // montako animaatioframea yhdellä kuvatiedoston rivillä (rivejä aina 5)
        xOffsetti: 50, // Hahmon säätäminen x-suunnassa
        yOffsetit: [2,0,0,0,2], // Hahmon säätäminen y-suunnassa eri animaatioissa (paikallaan, kävely, juoksu, hyppy, kaatuminen)
        hitbox: {a: 2, l: 98} // x-suunnan osuma-alueen offset: a: alue alkaa, l: alue loppuu
    },
    // kissa
    {
        kuvatiedosto: '../kuvat/kissa.png',
        animaatioFrameja: 10,
        xOffsetti: 0,
        yOffsetit: [18,16,16,14,4],
        hitbox: {a: 30, l: 155}
    },
    // dino
    {
        kuvatiedosto: '../kuvat/dino.png',
        animaatioFrameja: 10,
        xOffsetti: 45,
        yOffsetit: [3,2,2,0,2],
        hitbox: {a: 14, l: 193}
    },
    // joulupukki
    {
        kuvatiedosto: '../kuvat/joulupukki.png',
        animaatioFrameja: 10,
        xOffsetti: 20,
        yOffsetit: [3,2,2,0,2],
        hitbox: {a: 38, l: 200}
    }
]

class Pelaaja {
    constructor(id) {
        this.kuva = new Image();
        this.kuvanFramet = hahmot[id].animaatioFrameja; // Monestako animaatioruudusta yksi animaatio koostuu
        // Pyritään 30fps:ään, lasketaan montako kertaa sama animaatioruutu pitää toistaa että kaikki ruudut toistetaan 1 sekunnin aikana
        this.framekerroin = 30 / this.kuvanFramet; 
        this.nykyinenFrame = 0; // Mikä frame piirretään
        this.xOffset = hahmot[id].xOffsetti; // Hahmon kuvan säätäminen x-suunnassa
        this.yOffsetit = hahmot[id].yOffsetit; // Hahmon kuvan säätäminen eri animaatioissa y-suunnassa
        this.kuvarivi = 0; // Mitä "animaatiorivä" käytetään
        this.saaPiirtaa = false; // Milloin hahmon saa piirtää ja milloin ei (=hahmon kuvan latautuessa)
        // Määritetään hahmon kuvaan liittyviä ominaisuuksia vasta kun kuva on latautunut
        this.kuva.onload = () => {
            this.leveys = this.kuva.width / this.kuvanFramet; // Yhden animaatioruudun leveys
            this.korkeus = this.kuva.height / 5; // Kaikissa kuvatiedostoissa on 5 eri "riviä" animaatioita
            this.piirtopaikka = { // hahmon piirtopaikka
                x: Math.round(canwidth / 2 - this.leveys / 2 + this.xOffset),
                y: canheight - this.korkeus 
            }
            this.saaPiirtaa = true;
        }
        this.kuva.src = hahmot[id].kuvatiedosto; // Hahmon kuvatiedosto lataukseen
        this.hyppyKaynnissa = false; // Onko hahmo hyppäämässä, tämän avulla estetään hyppäämästä uudelleen ilmassa
        this.aidanTakana = false; // Onko hahmo aidan takana
        this.vaihdetaanPuolta = false; // Vaihdetaanko hypätessä aidan toiselle puolelle
        this.framelaskuri = 0; // Apulaskuri hyppyjen ja kaatumisen animointiin
        this.edellinenKuvarivi = 0; // Apumuuttuja hypyn jälkeiselle animaatioriville
        this.kaatuu = false; // Epäonnistuiko hyppy eli kaatuuko pelaajan hahmo
        this.gameOver = false;
        this.hitbox = { // Hahmon "osuma-alue" hypyn lakipisteessä
            alkaa: hahmot[id].hitbox.a,
            paattyy: hahmot[id].hitbox.l
        }
        this.nopeus = { // Hahmon nopeus
            x: 0,
            y: 0
        }
        this.paikka = { // Hahmon "paikka"
            x: 0,
            y: 0
        }
    } // End constructor

    piirra() {
        // Piirretään hahmo, jos sen saa piirtää
        if (this.saaPiirtaa) { 
            // piirretään samaa ruutua useamman kerran perakkain että saadaan animaatiosta sekunnin pituinen
            // lasketaan mikä ruutu piirretaan
            let piirrettavaFrame = Math.floor(this.nykyinenFrame / this.framekerroin);

            ctx.drawImage(
                this.kuva,                      // Source
                piirrettavaFrame * this.leveys, // Source: x
                this.kuvarivi * this.korkeus,   // Source: y
                this.leveys,                    // Source: width
                this.korkeus,                   // Source: height
                this.piirtopaikka.x,            // Destination: x
                this.piirtopaikka.y - this.yOffsetit[this.kuvarivi] + this.paikka.y, // Destination: y
                this.leveys,                    // Destination: width
                this.korkeus                    // Destination: height
                )

            // Jos peli ei ole ohi lasketaan seuraavalla kerralla piirrettävä ruutu
            if (!this.gameOver) { 
                this.nykyinenFrame = (this.nykyinenFrame < 30-1) ? this.nykyinenFrame += 1 : 0;
            }

            // Debug
            if (this.hyppyKaynnissa && debug && this.vaihdetaanPuolta) {
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = 'red';
                ctx.fillRect(
                    this.piirtopaikka.x + this.hitbox.alkaa,
                    this.piirtopaikka.y - this.yOffsetit[this.kuvarivi] + this.paikka.y,
                    this.hitbox.paattyy - this.hitbox.alkaa,
                    this.korkeus
                );
                ctx.globalAlpha = 1;
            }
        }
    } // end piirra()

    tarkastaOsuma() {
        let osuma = false;
        aidat.forEach((aita) => {
            if (aita.nakyvilla) {
                if (aita.osuuko(this.piirtopaikka.x + this.hitbox.alkaa, this.piirtopaikka.x + this.hitbox.paattyy)) {
                    osuma = true;
                }
            }
        })
        return osuma;
    }

    paivita() {

        // Onko hyppy käynnissä?
        if (this.hyppyKaynnissa) {

            // Tarkistetaan onko framelaskuri välillä 3-30 ja kuvarivi jotain muuta kuin hyppyanimaation rivi
            if (this.framelaskuri > 2 && this.framelaskuri <= 30 && this.kuvarivi != 3) {
                // Käytössä oleva kuvarivi talteen
                this.edellinenKuvarivi = this.kuvarivi;
                // Siirrytään käyttämään hyppyanimaation riviä
                this.kuvarivi = 3;
            } else if (this.framelaskuri > 30 && this.kuvarivi == 3) {
                this.kuvarivi = this.edellinenKuvarivi;
            }

            this.framelaskuri += 1;
        }

        // Kaatuminen käynnissä?
        if (this.kaatuu && this.kuvarivi == 4) {
            // Jos framelaskuri = 28, game over
            if (this.framelaskuri == 28) {
                this.gameOver = true;
                this.nopeus.x = 0;
                tila = 'g';
            } else {
                this.framelaskuri += 1;
                // Lasketaan liikkumisnopeus framelaskurin mukaan
                this.nopeus.x = (this.framelaskuri < 8) ? 3 : (this.framelaskuri < 16) ? 2 : (this.framelaskuri < 24) ? 1 : 0;
                this.paikka.x += this.nopeus.x; 
            }
        } else { // Ei kaatumista, jatketaan normaalisti
            
            // Pistelisäyksen päivittäminen
            if (this.nopeus.x != 0) pistelisays -= 0.2;

            // Nopeuden vaikutus
            this.paikka.x += this.nopeus.x;
            this.paikka.y += this.nopeus.y;
         
            // Nopeus y-suunnassa muuttuu painovoiman verran, jos pelaajan y on jotain muuta kuin nolla
            let edellinenNopeus = this.nopeus.y;
            this.nopeus.y = (this.paikka.y != 0) ? this.nopeus.y + painovoima : 0;

            // Onko hyppy lakipisteessä eli korkeimmillaan?
            if (edellinenNopeus < 0 && this.nopeus.y >= 0) {
                // Vaihdetaanko puolta?
                if (this.vaihdetaanPuolta) {
                    // Osuuko aitaan?
                    if (this.tarkastaOsuma()) {
                        // Kyllä, osuu aitaan
                        this.kaatuu = true;
                        lopputeksti = 'Osuit hypätessäsi tiiliaitaan';
                    } else {
                        // Ei osu aitaan
                        this.aidanTakana = !this.aidanTakana;
                        pistelisays = 50;
                    }
                }
            }

            // Ollaanko "maan" tasolla?
            if (this.paikka.y >= 0 && this.hyppyKaynnissa) {
                this.hyppyKaynnissa = false;
                this.vaihdetaanPuolta = false;
                this.nopeus.y = 0;
                this.paikka.y = 0;
                this.framelaskuri = 0;
                if (this.kaatuu) {
                    this.kuvarivi = 4;
                    this.nykyinenFrame = 0;
                    this.nopeus.x = 3;
                }
            }

            if (this.nopeus.x != 0) pistemaara += pistelisays;

            // Jos käynnissä ei ole hyppy tai kaatuminen, kuvarivi määräytyy nopeuden mukaan
            if (this.kuvarivi != 3 && this.kuvarivi != 4 && this.nopeus.x != 0) {
                this.kuvarivi = (this.nopeus.x <= 3) ? 1 : 2;
            }
        }

        //this.piirra();
    } // End paivita()

    vaihdaHahmo(id) {
        this.saaPiirtaa = false;
        this.kuvanFramet = hahmot[id].animaatioFrameja;
        this.framekerroin = 30 / this.kuvanFramet;
        this.yOffsetit = hahmot[id].yOffsetit;
        this.xOffset = hahmot[id].xOffsetti;
        this.hitbox = { alkaa: hahmot[id].hitbox.a, paattyy: hahmot[id].hitbox.l };
        this.kuva.onload = () => {
            this.leveys = this.kuva.width / this.kuvanFramet;
            this.korkeus = this.kuva.height / 5;
            this.piirtopaikka = { // hahmon piirtopaikka
                x: Math.round(canwidth / 2 - this.leveys / 2 + this.xOffset),
                y: canheight - this.korkeus 
            };
            this.saaPiirtaa = true;
        }
        this.kuva.src = hahmot[id].kuvatiedosto;
        this.nollaa();
    }

    nollaa() {
        pistelisays = 50;
        pistemaara = 0;
        this.kaatuu = false;
        this.gameOver = false;
        this.kuvarivi = 0;
        this.hyppyKaynnissa = false; // Onko hahmo hyppäämässä, tämän avulla estetään hyppäämästä uudelleen ilmassa
        this.aidanTakana = false; // Onko hahmo aidan takana
        this.vaihdetaanPuolta = false; // Vaihdetaanko hypätessä aidan toiselle puolelle
        this.framelaskuri = 0; // Apulaskuri hyppyjen ja kaatumisen animointiin
        this.edellinenKuvarivi = 0; // Apumuuttuja hypyn jälkeiselle animaatioriville
        this.nopeus = { // Hahmon nopeus
            x: 0,
            y: 0
        }
        this.paikka = { // Hahmon "paikka"
            x: 0,
            y: 0
        }
    }
} // end class Pelaaja

let pelaaja = new Pelaaja(hahmoid);

class Aita {
    constructor(aidanTyyppi, xPaikka, leveys) {
        this.tyyppi = aidanTyyppi; // 1 = puuaita, 2 = tiiliaita, 3 = tiiliaidan pääty
        this.kuva = {
            // puuaidan kuvan vasemman reunan x-koordinaatti taustat.png:ssä  on 1180
            // tiiliaidan kuvan vasemman reunan x-koordinaatti on 1335
            // kun tyyppi = 1 kuva alkaa koordinaateista (1180, 0)
            // Kun tyyppi on joitain muuta kuin 1, kuva alkaa koordinaateista (1335, 0)
            x: (this.tyyppi == 1) ? 1180 : 1335,
            y: 0, // molemmat aidankuvat alkavat ylälaidasta
            leveys: leveys,
            // puuaidan korkeus on 80 ja tiiliaidan 118
            korkeus: (this.tyyppi == 1) ? 80 : 118
        }
        this.paikka = {
            x: xPaikka,
            y: canvas.height - this.kuva.korkeus - 25 
        }
        this.nakyvilla = false; // onko aita näkyvillä?
        this.piirtopaikka = 0; // todelilnen piirtopaikka ruudulle
    } // end constructor

    piirra() {
        // lasketaan todellinen piirtopaikka
        this.piirtopaikka = this.paikka.x + pelaaja.piirtopaikka.x - pelaaja.paikka.x;

        // tarkistetaan onko aita näkyvillä, jos on piirretään se
        if (this.piirtopaikka + this.kuva.leveys >= 0 && this.piirtopaikka <= canvas.width) {
            //if (this.tyyppi != 0) {
                if (pelaaja.kaatuu && pelaaja.aidanTakana && this.tyyppi != 1) ctx.globalAlpha = 0.6;
                ctx.drawImage(taustakuvat,
                    this.kuva.x, // Source
                    this.kuva.y,
                    this.kuva.leveys,
                    this.kuva.korkeus,
                    this.piirtopaikka, // Destination
                    this.paikka.y,
                    this.kuva.leveys,
                    this.kuva.korkeus);
                ctx.globalAlpha = 1;
                    this.nakyvilla = true;
            //} 
        } else this.nakyvilla = false;
    } // end piirra()

    paivita() {
        this.piirra();
        this.x += pelaaja.nopeus.x;
    }

    osuuko(hahmonAlku, hahmonLoppu) {
        if (this.tyyppi == 1) {
            return false
        } else {
            if (hahmonLoppu >= this.piirtopaikka && hahmonAlku <= this.piirtopaikka + this.kuva.leveys) {
                return true
            } else return false;
        }
    }

} // end class Aita

// Pelin aidat, 0 = ei aitaa, 1 = puuaita, 2 = tiiliaita, 3 = tiiliaidan pääty
// HUOM! alussa 3 kpl nollaa ja kakkosen jälkeen aina kolmonen että tiiliaita päättyy siististi
const aitaelementit = [0,0,0,1,1,2,2,3,1,1,2,2,3,1,1,2,2,2,2,3,1,1,2,2,2,2,2,3,1,2,2,2,2,2,2,3,1,2,2,2,2,2,2,2,2,2,2,3,1,2,2,2,2,2,2,2,2,2,2,2,2,3,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1,2,2,2,2,2,2,2,2,3,1,2,2,2,2,2,2,2,2,2,2,3,1,2,2,2,3,1,1,2,2,2,2,2,2,2,2,2,2,3,1,2,3,1,2,3,1,1]
// Aita-elementtien levydet: ei aitaa = 220, puuaita = 142, tiiliaita = 220, tiiliaidan pääty = 29
const elementtienLeveydet = [220, 142, 220, 29];
// Aita-elementtien x-offset eli jos samaa elementtiä on monta kertaa peräkkäin, paljonko seuraava elementti menee edellisen päälle
const elementtienOffsetit = [0,2,0,0,0];
// apumuuttujia
let aKohta = 0, aEdellinen = 0;

// täytetään aidat-array
aitaelementit.forEach((arvo) => {
    // Onko kysessä aitaelementti vai tyhjä tila?
    if (arvo != 0) {
        // onko lisättävä elementti sama kuin edellinen? Jos on, vähennetään offsetti
        aKohta = (aEdellinen == arvo) ? aKohta - elementtienOffsetit[arvo] : aKohta;
        // lisätään arrayhin uusi aita
        aidat.push(new Aita(arvo,aKohta,elementtienLeveydet[arvo]));
    } 
    aKohta += elementtienLeveydet[arvo];
    aEdellinen = arvo;
});

// nappuloiden ja nappien käsittelijä 
function painettu(nappi) {
    
    // alkuruutu
    if (tila == 'a') {
        switch (nappi) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                // Jos hahmon kuvan lataaminen ei ole kesken aloitetaan peli
                if (pelaaja.saaPiirtaa) {
                    if (naytaOhjeet) {
                        tila = 'o';
                    } else {
                        tila = 'p';
                        pelaaja.nopeus.x = 3;
                    }
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                // Jos hahmon kuvan lataaminen ei ole kesken vaihdetaan hahmon kuvaa
                if (pelaaja.saaPiirtaa) {
                    hahmoid = (hahmoid+1 < hahmot.length) ? hahmoid += 1 : 0;
                    pelaaja.vaihdaHahmo(hahmoid);
                }
                break;
        }
    } else 
    // ohjeruutu
    if (tila == 'o') {
        switch (nappi) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'ArrowDown':
            case 's':
            case 'S':
                tila='p';
                pelaaja.nopeus.x = 3;
                break;
        }
    } else 
    // game over
    if (tila == 'g') {
        switch (nappi) {
            case 'ArrowUp':
            case 'w':
            case 'W':
            case 'ArrowDown':
            case 's':
            case 'S':
                tila = 'a';
                pelaaja.nollaa();
                tekstinkohta = 0;
                break;
        }
    } else 
    // pelitila
    if (tila == 'p') {
        switch (nappi) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (!pelaaja.hyppyKaynnissa && !pelaaja.kaatuu) {
                    pelaaja.hyppyKaynnissa = true;
                    pelaaja.nopeus.y = -8;
                    // vaihdetaan puolta jos pelaaja ei ole aidan takana, muussa tapauksessa ei vaihdeta puolta
                    pelaaja.vaihdetaanPuolta = (pelaaja.aidanTakana == false) ? true : false;
                }
            break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (!pelaaja.hyppyKaynnissa && !pelaaja.kaatuu) {
                    pelaaja.hyppyKaynnissa = true;
                    pelaaja.nopeus.y = -8;
                    // vaihdetaan puolta jos pelaaja on aidan takana, muussa tapauksessa ei vaihdeta puolta
                    pelaaja.vaihdetaanPuolta = (pelaaja.aidanTakana == true) ? true : false;
                }
            break;
        }
    
    }
}

function laskenappienpaikka() {
    if (touch) {
        // Kosketuksessa käytettävien nappuloiden sijoittelu
        let canvasPaikka = canvas.getBoundingClientRect();
        document.querySelectorAll('.nappulat').forEach ((ele, ndx) => {
            //ele.style.left = Math.round(canvasPaikka.left) + 'px';
            //console.log(ele.style.left);
            //ele.style.left = 0;
            ele.style.top = canvasPaikka.top + canvasPaikka.height / 2 * ndx + 'px';
            ele.style.height = canvasPaikka.height / 2 + 'px';
            //ele.style.width = window.innerWidth + 'px';
            //ele.disabled = false;
        })
    }
    /* laskeSkaala();  */
}

function sallinapit() {
    laskenappienpaikka();
    document.querySelectorAll('.nappulat').forEach ((ele) => {
        if (ele.disabled) ele.disabled = false;
    })
    document.querySelector('#info').style.display = 'none';

}


// == ONLOAD ===========================================================================================
// Odotetaan että sivu ja kaikki sen resurssit on latautunut
window.onload = () => {
    document.getElementById('odota').style.display = 'none';
    document.getElementById('kanvaasi').style.opacity = 1;
    
    /* laskeSkaala();  */
    // Tarkistetaan tukeeko laite kosketusta
    if (navigator.maxTouchPoints > 0) {
        touch = true;
        document.querySelector('#info').style.display = 'block';
        laskenappienpaikka();
    }

    //window.addEventListener('resize',laskenappienpaikka);
    //screen.orientation.addEventListener('change', laskenappienpaikka);

    // luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen
    taustat = [
        // kaikki taustakuvat on yhdessä kuvatiedostossa (taustat.png)
        // parametrit: taustakuvan yläkulman x, taustakuvan yläkulman y, taustakuvan leveys, taustakuvan korkeus, kuvan sijoittuminen näytölle, nopeuskerroin
        new Tausta(0,0,1024,288,0,0),
        // negatiivinen kuvan sijoittumistieto (y-koordinaatti )tulkitaan siten, että siitä vähennetään kuvan korkeus
        // -canvas.height+25 = canvasin korkeus - kuvan korkeus - 25 (25 on viimeksi piirrettävän "taustan" korkeus)
        new Tausta(0,288,1920,400,-canheight+25,0.2), //harmaat rakennukset
        new Tausta(0,688,1920,420,-canheight+25,0.4), //muut rakennukset
        new Tausta(0,1108,1920,310,-canheight+25,0.6), //puut 
        new Tausta(0,1418,1920,25,-canheight,1.1) // keltainen maa 
    ];

    lintu2 = new Lintu2(); // musta lintu
    lintu1 = new Lintu1(); // kauempana oleva lintu

    window.addEventListener('keydown', (eve) => {
        painettu(eve.key);
    }) // end window.addEventListener


            /*
        window.onresize = () => {
            let canvasPaikka = canvas.getBoundingClientRect();
            document.querySelectorAll('.nappulat').forEach ((ele, ndx) => {
                ele.style.top = canvasPaikka.top + canvasPaikka.height / 2 * ndx + 'px';
                ele.style.height = canvasPaikka.height / 2 + 'px';
            })
        }
            */


    animoi();
}

//taustakuvien saanti cancakseen
class Tausta {
    constructor(x,y,leveys,korkeus,yOffset,nopeuskerroin) {      // yOffset, pysty siirtymä
        this.kuva = { // taustakuvan vasemman ylänurkan x- ja y-koordinaatit kuvatiedostossa sekä kuvan leveys ja korkeus
            x: x,
            y: y,
            leveys: leveys,
            korkeus: korkeus
        }
        this.piirtopaikka = { // taustakuvan piirtopaikka näytöllä, y pysyy samana, x muuttuu
            y: (yOffset < 0) ? Math.abs(this.kuva.korkeus+yOffset) : yOffset,
            x: 0
        }
        this.nopeuskerroin = nopeuskerroin; // taustakuvan liikkumisnopeus verrattuna pelihahmon nopeuteen
    }
    // sulkuihin pelaajanNopeus tms.
    piirra(pelaajanNopeus) {
        // Piirretään taustakuva
        ctx.drawImage(taustakuvat,
            this.kuva.x,this.kuva.y,this.kuva.leveys,this.kuva.korkeus, // Source
            this.piirtopaikka.x, this.piirtopaikka.y, this.kuva.leveys, this.kuva.korkeus // Destination
        );

        // Lasketaan uusi piirtopaikka: 
        // nykyisestä piirtopaikasta vähennetään pelaajan nopeus*nopeuskerroin --> kuva siirtyy vasemmalle
        this.piirtopaikka.x -= this.nopeuskerroin * pelaajanNopeus;
        let piirtopaikka = Math.round(this.piirtopaikka.x)

        // Loppuuko kuvasta leveys, pitääkö piirtää toinen kuva ensimmäisen perään?
        if (this.kuva.leveys + piirtopaikka < canwidth) { 
            // Kyllä, piirretään toinen kuva ensimmäisen perään
            ctx.drawImage(taustakuvat,
                this.kuva.x,this.kuva.y,this.kuva.leveys,this.kuva.korkeus, // Source
                this.kuva.leveys + piirtopaikka, this.piirtopaikka.y, this.kuva.leveys, this.kuva.korkeus // Destination
            );
            // Onko toinen kuva saavuttanut vasemman reunan, voidaanko piirtää taas vain yhtä kuvaa?
            if (this.kuva.leveys + piirtopaikka <= 0) {
                // Kyllä, "nollataan" piirtopaikka ja piirretään jatkossa vain yhtä kuvaa
                this.piirtopaikka.x = this.kuva.leveys + piirtopaikka;
            }
    
        }
    }
}
// Arpoo satunnaisen kokonaisluvun väliltä min (mukaan lukien) ja max (mukaan lukien)
function arvoSatunnainenLuku(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
console.log(arvoSatunnainenLuku, "arvoSatunnainenLuku")
//musta lintu
class Lintu2 {
    constructor() {
        this.animFrameja = 16; // Vaihda tason määrä
        this.nykyinenFrame = 0;
        this.leveys = lintuImg2.width / this.animFrameja;
        this.korkeus = 390; // Pienennetty korkeus
        this.paikka = {
            x: -210,  // Aseta linnun alku sivun vasempaan reunaan
            y: canheight - this.korkeus 
        };
        this.nopeus = {
            x: 4,  // Aseta linnun vaakasuuntainen nopeus
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

    paivita() {
        // Vaakasuuntainen liike
        this.paikka.x += this.nopeus.x;
        // Tarkista, onko lintu mennyt näytön oikean reunan yli, ja aseta se näytön alkuun
        if (this.paikka.x + this.leveys > canwidth + 1000 + this.satunnainenLuku) { // lukua muuttamalla lintu pysyy näkymättömissä
            this.paikka.x = -210;
            console.log(this.satunnainenLuku, "luku")
            this.generoiSatunnainenLuku();
        }
    }

    generoiSatunnainenLuku() {
        this.satunnainenLuku = arvoSatunnainenLuku(1, 1000);
        console.log(this.satunnainenLuku, "Generoi");
    } 
}

//musta lintu
class Lintu1 {
    constructor() {
        this.animFrameja = 16; // Vaihda tason määrä
        this.nykyinenFrame = 0;
        this.leveys = lintuImg2.width / this.animFrameja;
        this.korkeus = 380; // Pienennetty korkeus
        this.paikka = {
            x: -220,  // Aseta linnun alku sivun vasempaan reunaan
            y: canheight - this.korkeus 
        };
        this.nopeus = {
            x: 1.2,  // Aseta linnun vaakasuuntainen nopeus
            y: 0
        };
        this.generoiSatunnainenLuku();        
    }
    
       piirra() {
        ctx.drawImage(lintuImg2,
            this.nykyinenFrame * this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys / 4,
            this.korkeus / 4);
        this.nykyinenFrame = (this.nykyinenFrame < this.animFrameja - 1) ? this.nykyinenFrame += 1 : 0;
    }
    
    paivita() {
        // Vaakasuuntainen liike
        this.paikka.x += this.nopeus.x;
        // Tarkista, onko lintu mennyt näytön oikean reunan yli, ja aseta se näytön alkuun
        if (this.paikka.x + this.leveys > canwidth + 1000 + this.satunnainenLuku) { // lukua muuttamalla lintu pysyy näkymättömissä
            this.paikka.x = -210;
            console.log(this.satunnainenLuku, "luku")
            this.generoiSatunnainenLuku();
        }
    }

    generoiSatunnainenLuku() {
        this.satunnainenLuku = arvoSatunnainenLuku(1, 1000);
        console.log(this.satunnainenLuku, "Generoi");
    } 
}

const alkutekstit = [
    // Aina kolmen rivin sarjoissa
    ['','Paina nuoli ylös tai w aloittaaksesi','Paina nuoli alas tai s vaihtaaksesi hahmoa'],
    ['','Hahmografiikat / Character animation sprites','www.gameart2d.com'],
    ['Taustagrafiikat / Background graphics','Mobile Game Graphics','www.opengameart.com'],
    ['Musiikki / Music','Digital Love by AlexiAction','www.pixabay.com']
];
let haivekohta = [31,16,1], tekstinkohta = 0;

function varjo(paalle) {
    if (paalle) {
        // varjo päälle
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
    } else {
        // varjo pois
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
    }
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


            /* sininen taivas taustalla takimmaisena */
            ctx.fillStyle = 'skyblue';
            ctx.fillRect(0,0,canwidth,canheight);

            lintu1.paivita();
            lintu1.piirra();

            // Piirretään taustat 0-2
            for(let i=0; i < 3; i++) {
                taustat[i].piirra(pelaaja.nopeus.x);
            }
            
             // linnun piirtäminen
             lintu2.paivita();
             lintu2.piirra();
 
             // neljännen tausta piirtäminen (puut)
             taustat[3].piirra(pelaaja.nopeus.x);

            // Aitojen ja pelaajan hahmon piirtäminen
            // Onko hahmo aidan takana?
            if (pelaaja.aidanTakana) {
                // hahmo on aidan takana, piirretään se ensin
                pelaaja.paivita();
                pelaaja.piirra();
                aidat.forEach((aita) => {
                    aita.paivita();
                });
            } else {
                // hahmo ei ole aidan takana, piirretään aidat ensin
                // koska aidan piirtäminen riippuu pelaajan tiedoista, päivitetään pelaajan tiedot aina ensin
                pelaaja.paivita();
                aidat.forEach((aita) => {
                    aita.paivita();
                });
                pelaaja.piirra();
            }

            /* piirretään lähin tausta, keltainen maa */
            taustat[4].piirra(pelaaja.nopeus.x);
            
            // pelaajan nopeuden määrittelyä
            if (pelaaja.paikka.x > 2000 && pelaaja.nopeus.x == 3) pelaaja.nopeus.x = 4;
            if (pelaaja.paikka.x > 2050 && pelaaja.nopeus.x == 4) pelaaja.nopeus.x = 5;
            if (pelaaja.paikka.x > 20000 && pelaaja.nopeus.x == 5) pelaaja.nopeus.x = 4;
            if (pelaaja.paikka.x > 20050 && pelaaja.nopeus.x == 4) pelaaja.nopeus.x = 3;
            if (!pelaaja.hyppyKaynnissa && pelaaja.paikka.x > 20100 && pelaaja.nopeus.x == 3) {
                pelaaja.nopeus.x = 0;
                pelaaja.gameOver = true;
                lopputeksti = 'Onneksi olkoon! Pääsit radan läpi pistemäärällä '+Math.round(pistemaara / 10);
                tila = 'g';
            }

            if (tila == 'a') {
                // aloitusruudun piirtäminen
                //if (audioOK && musiikki.paused) musiikki.play();

                if (fontOK && hennyOK && abelOK) {
                    ctx.fillStyle = 'rgb(233, 88, 4)';
                    ctx.font = '32px Rowdies';
                    ctx.textAlign = 'center';
                    var text = 'Terttu ja Mika'
                    var text2 = 'esittävät pelin'
                    var text3 = 'Mennään siitä mistä aita on matalin'

                    varjo(true);

                    ctx.strokeStyle = 'black';  // Reunaviivan väri
                    ctx.lineWidth = 1.5;          // Reunaviivan leveys
                    ctx.strokeText(text, canvas.width / 2, 35);
                    ctx.fillText(text, canvas.width / 2, 35)
                    ctx.strokeText(text2, canvas.width / 2, 80);
                    ctx.fillText(text2, canvas.width / 2, 80)
                    ctx.font = '48px "Henny Penny"';
                    ctx.lineWidth = 4; 
                    ctx.strokeText(text3, canvas.width / 2, 80+60);
                    ctx.fillText(text3, canvas.width / 2, 80+60)
                    //ctx.fillText('Mennään siitä mistä aita on matalin',canwidth / 2, 80+60);

                    ctx.font = 'bold 36px Abel';
                    //ctx.strokeStyle = 'black';
                    ctx.fillStyle = 'white';
                    //ctx.lineWidth = 3;
                    ctx.letterSpacing = '2px';
                    // 230, 280, 330
                    ctx.globalAlpha = haive[haivekohta[0]];
                    //ctx.strokeText(alkutekstit[tekstinkohta][0],canwidth / 2, 230);
                    ctx.fillText(alkutekstit[tekstinkohta][0],canwidth / 2, 230);
                    ctx.globalAlpha = haive[haivekohta[1]];
                    //ctx.strokeText(alkutekstit[tekstinkohta][1],canwidth / 2, 280);
                    ctx.fillText(alkutekstit[tekstinkohta][1],canwidth / 2, 280);
                    ctx.globalAlpha = haive[haivekohta[2]];
                    //ctx.strokeText(alkutekstit[tekstinkohta][2],canwidth / 2, 330);
                    ctx.fillText(alkutekstit[tekstinkohta][2],canwidth / 2, 330);
                    ctx.globalAlpha = 1;

                    ctx.letterSpacing = '0px';
                    
                    varjo(false);

                    haivekohta.forEach((arvo, ndx) => {
                        arvo = (arvo+1 == haive.length) ? 0 : arvo + 1;
                        haivekohta[ndx] = arvo;
                    })
                    if (haivekohta[2] == 0) tekstinkohta = (tekstinkohta + 1 == alkutekstit.length) ? 0 : tekstinkohta + 1;
                }
            } else
            // pelitila
            if (tila == 'p') {
                let luku = Math.round(pistemaara / 10), pmaara;
                if (luku < 0) {
                    pistemaara = 0;
                    luku = 0;
                    if (!pelaaja.kaatuu) {
                        pelaaja.kaatuu = true;
                        lopputeksti = 'Juoksit liian kauan aidan samalla puolella.';
                        if (!pelaaja.hyppyKaynnissa) {
                            pelaaja.kuvarivi = 4;
                            pelaaja.framelaskuri = 0;
                            pelaaja.nykyinenFrame = 0;
                            pelaaja.nopeus.x = 3;
                        }
                    }
                }
                pmaara = luku.toString();

                while (pmaara.length < 6) {
                    pmaara = '0' + pmaara;
                }

                ctx.fillStyle = (pistelisays > 0) ? 'green' : 'red';
                ctx.font = '32px Arial';
                ctx.letterSpacing = '0px';
                ctx.textAlign = 'left';
                ctx.fillText(pmaara,canwidth / 2 - 44, 32);

            } else // end pelitila
            // Game over
            if (tila == 'g') {
                ctx.font = 'bold 36px Abel';
                ctx.strokeStyle = 'black';
                ctx.fillStyle = 'white';
                ctx.lineWidth = 3;
                ctx.letterSpacing = '2px';
                ctx.textAlign = 'center';

                varjo(true);

                // 230, 280, 330
                ctx.strokeText('Peli päättyi!',canwidth / 2, 230);
                ctx.fillText('Peli päättyi!',canwidth / 2, 230);
                ctx.strokeText(lopputeksti,canwidth / 2, 280);
                ctx.fillText(lopputeksti,canwidth / 2, 280);
                ctx.strokeText('Paina hyppynäppäintä jatkaaksesi',canwidth / 2, 330);
                ctx.fillText('Paina hyppynäppäintä jatkaaksesi',canwidth / 2, 330);
                varjo(false);

            } else
            // ohjeet
            if (tila == 'o') {
                let ohjeet = [
                    'Ohjeet',
                    ' ',
                    'Pelin tarkoituksena on kerätä mahdollisimman suuri pistemäärä', 
                    'hyppimällä aidan taakse ja eteen. Aidan toiselle puolella voi',
                    'hypätä vain kohdissa joissa ei ole aitaa tai on puuaita.', 
                    '',
                    'Hahmo hyppää aidan taakse painamalla nuoli ylös tai w-näppäintä.',
                    'Takaisin aidan eteen pääsee painamalla nuoli alas tai s-näppäintä.',
                    '',
                    'Mitä kauemmin etenet samalla puolella aitaa,', 
                    'sen vähemmän pisteitä saat. Jos etenet samalla', 
                    'puolella liian kauan, alkavat pisteesi vähentyä.',
                    '',
                    'Paina hyppynäppäintä aloittaaksesi.'
                ];
                ctx.font = 'bold 32px Abel';
                ctx.strokeStyle = 'black';
                ctx.fillStyle = 'white';
                ctx.lineWidth = 3;
                ctx.letterSpacing = '2px';
                ctx.textAlign = 'center';
                varjo(true);
                let tpaikka = 30;
                for (let i=0; i<ohjeet.length; i++) {
                    ctx.strokeText(ohjeet[i],canwidth / 2, tpaikka);
                    ctx.fillText(ohjeet[i],canwidth / 2, tpaikka);
                    tpaikka += 40;
                }
                naytaOhjeet = false;
                varjo(false);
            }
        }
    }
}