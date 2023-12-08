const canvas = document.querySelector('#kanvaasi');
const ctx = canvas.getContext("2d");
const canwidth = canvas.width, canheight = canvas.height;

let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let pistemaara = 0, pistelisays = 50, painovoima = 0.5, hahmoid = 0;
let tila = 'a'; // a = aloitusruutu, o = ohjeet, p = peli käynnissä, g = game over
let touch = false; // tukeeko laite kosketusta?
let aidat = []; // Aita-luokan oliot
let hennyOK = false, abelOK = false, fontOK = false, audioOK = false, lopputeksti = '', naytaOhjeet = true, debug = false, playAudio = false;
const musiikki = new Audio();

// Musiikki
musiikki.oncanplaythrough = () => {
    audioOK = true;
}
musiikki.autoplay = false;
musiikki.loop = true;
musiikki.src = '../musiikki/digital-love-reduced-bitrate.mp3';

// Taustakuvat
const taustakuvat = new Image();
taustakuvat.src = '../kuvat/taustat.png';
taustakuvat.onerror = (err) => {
    console.log(err);
}

// Ääninappulan kuvat
const audioOnImage = new Image(), audioOffImage = new Image();
audioOnImage.src = 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M560-131v-82q90-26 145-100t55-168q0-94-55-168T560-749v-82q124 28 202 125.5T840-481q0 127-78 224.5T560-131ZM120-360v-240h160l200-200v640L280-360H120Zm440 40v-322q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>';
audioOffImage.src = 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m616-320-56-56 104-104-104-104 56-56 104 104 104-104 56 56-104 104 104 104-56 56-104-104-104 104Zm-496-40v-240h160l200-200v640L280-360H120Zm280-246-86 86H200v80h114l86 86v-252ZM300-480Z"/></svg>';

// Linnut
const lintuImg2 = new Image();
lintuImg2.onload = () =>{
    console.log('lintu2 tiedosto ladattu')
}
lintuImg2.onerror = function() {
    console.error('Virhe kuvaa ladattaessa:', lintuImg2.src);
}
lintuImg2.src = '../kuvat/mustatLinnut2.png';

let taustat = [], lintu1, lintu2 // taustakuvia varten

// Fontit
const hennyFontti = new FontFace('Henny Penny','url(https://fonts.gstatic.com/s/hennypenny/v17/wXKvE3UZookzsxz_kjGSfPQtvXI.woff2)');
const abelFontti = new FontFace('Abel','url(https://fonts.gstatic.com/s/abel/v18/MwQ5bhbm2POE2V9BPQ.woff2)');
// Fontti tekstiin Terttu ja Mika esittävät pelin
const rowdiesFontti = new FontFace('Rowdies', 'url(https://fonts.gstatic.com/s/rowdies/v17/ptRJTieMYPNBAK21_rBDwQ.woff2)');

hennyFontti.load().then(() => {
    document.fonts.add(hennyFontti);
    hennyOK = true;
}, (err) => {
    console.log(err);
},
);

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

// Alkuruudun vaihtuvan tekstin "fade"-efekti
function rakennaHaive() {
    let alku = new Array(40).fill(0), loppu = [], keskikohta = new Array(30*6).fill(1);
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

// Pelaaja-luokka =========================================================================================
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

    tarkastaOsuma() { // Osuuko pelaajan hahmo aitaan?
        let osuma = false;
        aidat.forEach((aita) => { // Käydään läpi kaikki aidat
            if (aita.nakyvilla) { // Onko aita näkyvillä? Jos on, tarkastetaan osuuko hahmo aitaan
                if (aita.osuuko(this.piirtopaikka.x + this.hitbox.alkaa, this.piirtopaikka.x + this.hitbox.paattyy)) {
                    osuma = true;
                }
            }
        })
        return osuma;
    }

    paivita() { // Päivitetään pelihahmon tiedot

        // Onko hyppy käynnissä?
        if (this.hyppyKaynnissa) {
            // Hyppy on käynnissä
            // Tarkistetaan onko framelaskuri välillä 3-30 ja kuvarivi jotain muuta kuin hyppyanimaation rivi
            if (this.framelaskuri > 2 && this.framelaskuri <= 30 && this.kuvarivi != 3) {
                // Käytössä oleva kuvarivi talteen
                this.edellinenKuvarivi = this.kuvarivi;
                // Siirrytään käyttämään hyppyanimaation kuvariviä
                this.kuvarivi = 3;
            } else if (this.framelaskuri > 30 && this.kuvarivi == 3) { 
                // Jos framelaskuri on yli 30 ja käytössä on hypyn kuvarivi, siirrytään käyttämään ennen hyppyä käytössä ollutta kuvariviä
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
                // Ollaan, nollataan tietyt muuttujat
                this.hyppyKaynnissa = false;
                this.vaihdetaanPuolta = false;
                this.nopeus.y = 0;
                this.paikka.y = 0;
                this.framelaskuri = 0;
                // Onko hypyn aikana osuttu aitaan?
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
    } // End paivita()

    vaihdaHahmo(id) { // Ladataan toisen pelihahmon animaatiot ja päivitetään tiedot sen mukaisiksi
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

    nollaa() { // nollataan hahmoa koskevia tietoja
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

// Aita-luokka ============================================================================================
class Aita {
    constructor(aidanTyyppi, xPaikka, leveys) {
        this.tyyppi = aidanTyyppi; // 1 = puuaita, 2 = tiiliaita, 3 = tiiliaidan pääty
        this.kuva = {
            // puuaidan kuvan vasemman reunan x-koordinaatti taustakuvat sisältävässä tiedostossa on 1180
            // tiiliaidan kuvan vasemman reunan x-koordinaatti on 1335
            // kun tyyppi = 1 (puuaita) kuva alkaa koordinaateista (1180, 0)
            // Kun tyyppi on joitain muuta kuin 1, kuva alkaa koordinaateista (1335, 0)
            x: (this.tyyppi == 1) ? 1180 : 1335,
            y: 0, // molemmat aidankuvat alkavat kuvatiedoston ylälaidasta
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

    piirra() { // piirretään aidan osa
        // lasketaan todellinen piirtopaikka
        this.piirtopaikka = this.paikka.x + pelaaja.piirtopaikka.x - pelaaja.paikka.x;

        // tarkistetaan onko aidan osa näkyvillä, jos on piirretään se
        if (this.piirtopaikka + this.kuva.leveys >= 0 && this.piirtopaikka <= canvas.width) {
            // Jos pelaaja on kaatumassa aidan takana, tiiliaita muuttuu läpinäkyväksi
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
            // Varmistetaan että mitään muuta ei piirretä läpinäkyvänä
            ctx.globalAlpha = 1;
            // Jos aidan osa piirrettiin, se on näkyvillä
            this.nakyvilla = true;
        } else this.nakyvilla = false; // tämä aidan osa ei ole näkyvillä
    } // end piirra()

    paivita() { // piirretään aidan osa ja päivitetään sen uusi paikka seuraavalle piirtokerralle
        this.piirra();
        this.x += pelaaja.nopeus.x;
    }

    osuuko(hahmonAlku, hahmonLoppu) { // tarkastetaan osuuko pelaajan hahmo aidan osaan, jos osuu palautetaan true
        if (this.tyyppi == 1) { // jos kyseessä on puuaita, ei osumaa tarvitse edes tarkastaa
            return false
        } else {
            if (hahmonLoppu >= this.piirtopaikka && hahmonAlku <= this.piirtopaikka + this.kuva.leveys) {
                return true
            } else return false;
        }
    }

} // end class Aita


// Aidat ==================================================================================================
// Pelin aidat, 0 = ei aitaa, 1 = puuaita, 2 = tiiliaita, 3 = tiiliaidan pääty
// HUOM! alussa 3 kpl nollaa ja kakkosen jälkeen aina kolmonen että tiiliaita päättyy siististi
const aitaelementit = [0,0,0,1,1,2,2,3,1,1,1,2,2,3,1,1,1,2,2,2,2,3,1,1,2,2,2,2,2,3,1,1,2,2,2,2,2,2,3,1,1,2,2,2,2,2,2,3,1,2,2,2,2,3,1,1,2,2,2,2,2,2,2,2,3,1,2,2,2,2,3,1,1,2,2,2,2,2,2,2,2,2,2,2,2,3,1,1,2,2,2,2,2,2,2,2,3,1,2,2,2,2,2,2,2,3,1,1,2,2,2,3,1,2,2,2,3,1,1,2,2,2,2,3,1,2,2,2,3,1,1,2,2,2,2,2,3,1,1,2,2,2,2,2,2,3,1,2,2,2,2,2,2,3,1,1,2,2,2,2,2,2,2,2,2,3];
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

// nappuloiden ja nappien käsittelijä  =====================================================================
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
                haivekohta = [31,16,1];
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

// Lasketaan ylös- & alas-nappien paikka ruudulla, jos käytössä on kosketusta tukeva laite
function laskenappienpaikka() {
    if (touch) {
        // Kosketuksessa käytettävien nappuloiden sijoittelu
        let canvasPaikka = canvas.getBoundingClientRect();
        document.querySelectorAll('.nappulat').forEach ((ele, ndx) => {
            ele.style.top = canvasPaikka.top + canvasPaikka.height / 2 * ndx + 'px';
            ele.style.height = canvasPaikka.height / 2 + 'px';
        })
    }
}

// Sallitaan ylös- & alas-nappi, jos käytössä on kosketusta tukeva laite
function sallinapit() {
    laskenappienpaikka();
    document.querySelectorAll('.nappulat').forEach ((ele) => {
        if (ele.disabled) ele.disabled = false;
    })
    document.querySelector('#info').style.display = 'none';
}


// == ONLOAD ===========================================================================================
// Odotetaan että sivu ja kaikki sen resurssit ovat latautuneet
window.onload = () => {
    // Odota hetki -ilmoitus piiloon ja kanvaasi näkyville
    document.getElementById('odota').style.display = 'none';
    document.getElementById('kanvaasi').style.opacity = 1;
    
    // Tarkistetaan tukeeko laite kosketusta
    if (navigator.maxTouchPoints > 0) {
        touch = true;
        // Näytetään info kosketeltavasta laitteesta
        document.querySelector('#info').style.display = 'block';
        laskenappienpaikka();
        playAudio = true;
    } else {
        // ei-kosketeltava laite
        // lisätään canvasiin käsittelijä hiiren klikkausta varten
        canvas.addEventListener('click', (evnt) => {
            // vain aloitusruudussa
            if (tila == 'a') {
                // canvaksen koordinaatit ja mitat
                let bcr = canvas.getBoundingClientRect();
                // osuuko hiiren klikkaus vasemapaan alakulmaan?
                if (((evnt.x - bcr.left) < (bcr.width * 0.047)) && ((bcr.height+bcr.top - evnt.y) < (bcr.height * 0.083))) {
                    if (playAudio) { // soitto päällä
                        musiikki.pause();
                        playAudio = false;
                    } else {
                        musiikki.play();
                        playAudio = true;
                    }
                }
            }
        })

    }

    if (touch) screen.orientation.addEventListener('change', laskenappienpaikka);

    // luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen
    taustat = [
        // kaikki taustakuvat on yhdessä kuvatiedostossa (taustat.png)
        // parametrit: taustakuvan yläkulman x, taustakuvan yläkulman y, taustakuvan leveys, taustakuvan korkeus, kuvan sijoittuminen näytölle, nopeuskerroin
        new Tausta(0,0,1024,288,0,0),
        // negatiivinen kuvan sijoittumistieto (y-koordinaatti )tulkitaan siten, että siitä vähennetään kuvan korkeus
        // -canvas.height+25 = canvasin korkeus - kuvan korkeus - 25 (25 on viimeksi piirrettävän "taustan" korkeus)
        new Tausta(0,288,1920,400,-canheight+35,0.2), //harmaat rakennukset
        new Tausta(0,688,1920,420,-canheight+25,0.4), //muut rakennukset
        new Tausta(0,1108,1920,310,-canheight+25,0.6), //puut 
        new Tausta(0,1418,1920,25,-canheight,1.1) // keltainen maa 
    ];

    // Luodaan vasemmalta oikealle lentävät linnut
    lintu2 = new Lintu(390,2,4); // korkeus, koko, nopeus
    lintu1 = new Lintu(370,4,1.4); // kauempi lintu

    // Lisätään käsittelijä näppäimen painamiselle
    window.addEventListener('keydown', (eve) => {
        painettu(eve.key);
    }) 

    // Canvasin animointi käyttöön
    animoi();
}

// Tausta-luokka ===========================================================================================
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

//musta lintu
// Lintu-luokka ==========================================================================================
class Lintu {
    constructor(korkeus, koko, nopeus) {
        this.korkeus = korkeus;
        this.koko = koko;
        this.nopeus = nopeus;
        this.animFrameja = 16; // Vaihda tason määrä
        this.nykyinenFrame = 0;
        this.leveys = lintuImg2.width / this.animFrameja;
        this.paikka = {
            x: -210,  // Aseta linnun alku sivun vasempaan reunaan
            y: canheight - this.korkeus 
        };
        this.nopeus = {
            x: this.nopeus,  // Aseta linnun vaakasuuntainen nopeus
            y: 0
        };
        this.satunnainenLuku = 0;
    }

    piirra() { // piirretään lintu
        ctx.drawImage(lintuImg2,
            this.nykyinenFrame * this.leveys, /* source x */
            0, /* source y */
            this.leveys,
            this.korkeus,
            this.paikka.x, /* destination x */
            this.paikka.y, /* destination y */
            this.leveys / this.koko,
            this.korkeus / this.koko);
        this.nykyinenFrame = (this.nykyinenFrame < this.animFrameja - 1) ? this.nykyinenFrame += 1 : 0;
    }

    paivita() {
        // Vaakasuuntainen liike
        this.paikka.x += this.nopeus.x;
        // Tarkista, onko lintu mennyt näytön oikean reunan yli, ja aseta se näytön alkuun
        if (this.paikka.x + this.leveys > canwidth + 1000 + this.satunnainenLuku) { // lukua muuttamalla lintu pysyy näkymättömissä
            this.paikka.x = -210;
            this.generoiSatunnainenLuku(200,1000);
            if (debug) console.log("luku:",this.satunnainenLuku);
        }
    }

    generoiSatunnainenLuku(min, max) {
        this.satunnainenLuku = Math.floor(Math.random() * (max - min + 1)) + min;
    } 
}

const alkutekstit = [
    // Aina kolmen rivin sarjoissa
    ['','Paina nuoli ylös tai w aloittaaksesi','Paina nuoli alas tai s vaihtaaksesi hahmoa'],
    ['Hahmojen animaatiot / Character animation sprites','','www.gameart2d.com'],
    ['Taustagrafiikat / Background graphics','Mobile Game Graphics','www.opengameart.com'],
    ['Musiikki / Music','Digital Love by AlexiAction','www.pixabay.com'],
    ['Projektissa käytetyt ohjelmat','Visual Studio Code, Git, Adobe Photoshop,','Corel PaintShop Pro, Piskel, VLC Media Player'],
    ['© 2023','Terttu Toivonen ja Mika Jalkanen','Tehty osana Esedun JavaScript-opintoja']
];

let haivekohta = [31,16,1], tekstinkohta = 0;

// Varjo päälle tai pois (true/false)
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

// Canvasin animointi =====================================================================================
function animoi(aika) {
    // Kutsutaan tätä samaa funktiota taas ennen seuraavaa ruudun "maalausta"
    window.requestAnimationFrame(animoi);

    // Koska ruudunpäivitysnopeus on yleensä 60Hz tai suurempi, rajoitetaan ruudun 
    // piirtämistä n. 30 kertaan sekunnissa jotta animaatiot eivät pyöri liian nopeasti
    let fps = Math.round(1000 / (aika-vanhaAika));
    if (Number.isInteger(fps)) {
        if (fps <= 30) { /* max. 30 fps */
            if (debug) console.log(fps + 'fps');
            vanhaAika = aika;

            // Kaikki piirtäminen tämän jälkeen
            /* sininen taivas taustalla takimmaisena */
            ctx.fillStyle = 'skyblue';
            ctx.fillRect(0,0,canwidth,canheight);

            // Piirretään taustat 0-1 kerran 
            for(let i=0; i < 2; i++) {
                taustat[i].piirra(pelaaja.nopeus.x);
            }

            // Päivitetään ja piirretään taaimmainen lintu
            lintu1.paivita();
            lintu1.piirra();

            // kolmannen taustan piirtäminen (värikkäät rakennukset)
            taustat[2].piirra(pelaaja.nopeus.x);
            
            // linnun piirtäminen (lähempänä oleva lintu)
            lintu2.paivita();
            lintu2.piirra();
 
            // neljännen taustan piirtäminen (puut)
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

            // Loput piirtämiset riippuvat siitä missä tilassa ollaan menossa
            if (tila == 'a') {
                // aloitusruudun piirtäminen
                // Jos kyseessä on kosketeltava laite, käynnistetään tarvittaessa musiikki
                if (audioOK && musiikki.paused && playAudio && touch) musiikki.play();

                // Jos fontit on kunnossa, piirretään aloitusruudun tekstit
                if (fontOK && hennyOK && abelOK) {
                    ctx.fillStyle = 'rgb(233, 88, 4)';
                    ctx.font = '32px Rowdies';
                    ctx.textAlign = 'center';
                    let text = 'Terttu ja Mika'
                    let text2 = 'esittävät pelin'
                    let text3 = 'Mennään siitä mistä aita on matalin'

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
                    
                    // Vaihtuvat tekstit
                    ctx.font = 'bold 36px Abel';
                    ctx.fillStyle = 'white';
                    ctx.letterSpacing = '2px';
                    ctx.globalAlpha = haive[haivekohta[0]];
                    ctx.fillText(alkutekstit[tekstinkohta][0],canwidth / 2, 230);
                    ctx.globalAlpha = haive[haivekohta[1]];
                    ctx.fillText(alkutekstit[tekstinkohta][1],canwidth / 2, 280);
                    ctx.globalAlpha = haive[haivekohta[2]];
                    ctx.fillText(alkutekstit[tekstinkohta][2],canwidth / 2, 330);
                    ctx.globalAlpha = 1;

                    ctx.letterSpacing = '0px';
                    
                    varjo(false);

                    if (!touch) { // Jos ei ole kosketeltava laite, piirretään äänen kuvake vasempaan alanurkkaan
                        ctx.globalAlpha = 0.4;
                        if (playAudio) {
                            ctx.drawImage(audioOnImage, 0,0,24,24, 0, canheight-48,48,48);
                        } else {
                            ctx.drawImage(audioOffImage, 0,0,24,24, 0, canheight-48,48,48);
                        }
                        ctx.globalAlpha = 1;
                        
                    }

                    // päivitetään vaihtuvien tekstien läpinäkyvyyden arvo
                    haivekohta.forEach((arvo, ndx) => {
                        arvo = (arvo+1 == haive.length) ? 0 : arvo + 1;
                        haivekohta[ndx] = arvo;
                    })
                    if (haivekohta[2] == 0) tekstinkohta = (tekstinkohta + 1 == alkutekstit.length) ? 0 : tekstinkohta + 1;
                }
            } else
            // pelitila
            if (tila == 'p') {

                // pelaajan nopeuden määrittelyä
                if (pelaaja.paikka.x > 2000 && pelaaja.nopeus.x == 3) pelaaja.nopeus.x = 4;
                if (pelaaja.paikka.x > 2050 && pelaaja.nopeus.x == 4) pelaaja.nopeus.x = 5;
                if (pelaaja.paikka.x > 29800 && pelaaja.nopeus.x == 5) pelaaja.nopeus.x = 4;
                if (pelaaja.paikka.x > 29900 && pelaaja.nopeus.x == 4) pelaaja.nopeus.x = 3;
                if (!pelaaja.hyppyKaynnissa && pelaaja.paikka.x > 30000 && pelaaja.nopeus.x == 3) {
                    pelaaja.nopeus.x = 0;
                    pelaaja.gameOver = true;
                    lopputeksti = 'Onneksi olkoon! Pääsit radan läpi pistemäärällä '+Math.round(pistemaara / 10);
                    tila = 'g';
                }

                // Pistemäärä
                let luku = Math.round(pistemaara / 10), pmaara;
                // Jos pistemäärä on mennyt miinuksen puolelle --> game over
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

                // Pistemäärän piirtäminen
                ctx.letterSpacing = '0px';
                ctx.textAlign = 'left';
                ctx.font = '32px Arial';
                ctx.fillStyle = (pistelisays > 0) ? 'green' : 'red';
                ctx.fillText(pmaara,canwidth / 2 - 42, 32);

                // Edetyn matkan näyttäminen palkkina canvasin alalaidassa
                let edistyminen = Math.round(pelaaja.paikka.x / 30000 * canwidth);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(0, canheight-15, edistyminen, 15);
 
            } else // end pelitila
            // Game over
            if (tila == 'g') {
                // Peli päättyi -ruudun tekstit
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

                // Piirretään edetyn matkan palkki suurempana
                let edistyminen  = Math.round(pelaaja.paikka.x / 30000 * canwidth);
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.fillRect(0, canheight-20, edistyminen, 20);

                // Lisätään edettyyn matkaan prosenttiluku
                let pros = Math.round(pelaaja.paikka.x / 300);
                ctx.font = 'bold 18px Abel';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'black';
                ctx.fillText(pros+'%', Math.round(edistyminen / 2) , canheight-4);

            } else
            // ohjeet
            if (tila == 'o') {
                let ohjeet = [
                    'Ohjeet',
                    ' ',
                    'Pelin tarkoituksena on kerätä mahdollisimman suuri pistemäärä', 
                    'hyppimällä aidan taakse ja eteen. Aidan toiselle puolelle voi',
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
                varjo(true); // Varjo päälle
                let tpaikka = 30;
                for (let i=0; i<ohjeet.length; i++) {
                    ctx.strokeText(ohjeet[i],canwidth / 2, tpaikka);
                    ctx.fillText(ohjeet[i],canwidth / 2, tpaikka);
                    tpaikka += 40;
                }
                naytaOhjeet = false; // ohjeet näytetään vain kerran
                varjo(false); // Varjo pois
            }
        }
    }
}
