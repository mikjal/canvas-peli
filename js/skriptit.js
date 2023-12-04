const canvas = document.querySelector('#kanvaasi');
const ctx = canvas.getContext("2d");
const canwidth = canvas.width, canheight = canvas.height;


let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let pistemaara = 0, pistelisays = 50, painovoima = 0.5, hahmoid = 0;
let tila = 'a'; // a = aloitusruutu, o = ohjeet, p = peli käynnissä, g = game over
let touch = false; // tukeeko laite kosketusta?
let aidat = []; // Aita-luokan oliot
let fontOK = false;

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

hennyFontti.load().then(() => {
    document.fonts.add(hennyFontti);
    fontOK = true;
}, (err) => {
    console.log(err);
},
);

/*
// Skaalaus
function laskeSkaala() {
    // Lasketaan suhdeluvut levydelle ja korkeudelle
    let lev = (window.innerWidth-10) / canwidth, kor = (window.innerHeight-15) / canheight;
    // Kumman mukaan säädetään skaala, leveyden vai korkeuden?
    let skaala = (lev < kor) ? (Math.round(lev * 100)) / 100 : (Math.round(kor * 100)) / 100;
    // Minimi on 0.35, maksimi 1.5
    skaala = (skaala < 0.35) ? 0.35 : (skaala <= 1.5) ? skaala : 1.5;
    console.log(window.innerWidth,window.innerHeight,skaala);

    // Muutetaan kaikki skaalaus-luokan elementit käyttämään uutta arvoa
    document.querySelectorAll('.skaalaus').forEach((ele) => {
        ele.style.transform = 'scale('+skaala+')';
        ele.style.transformOrigin = '50% 0';
    });
}
*/
/*
laskeSkaala();
*/

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
        }
    } // end piirra()

    tarkastaOsuma() {
        let osuma = false;
        aidat.forEach((aita) => {
            if (aita.osuuko(this.piirtopaikka.x + this.hitbox.alkaa, this.piirtopaikka.x + this.hitbox.paattyy)) {
                osuma = true;
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
            } else {
                this.framelaskuri += 1;
                // Lasketaan liikkuumisnopeus framelaskurin mukaan
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

        this.piirra();
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
                if (pelaaja.kaatuu && pelaaja.aidanTakana) ctx.globalAlpha = 0.7;
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
        if (!this.nakyvilla || this.tyyppi == 1) {
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
const aitaelementit = [0,0,0,1,1,2,2,3,0,1,1,1]
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
                    tila = 'p';
                pelaaja.nopeus.x = 3;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                        hahmoid = (hahmoid+1 < hahmot.length) ? hahmoid += 1 : 0;
                pelaaja.vaihdaHahmo(hahmoid);
                break;
        }
    } else 
    // ohjeruutu
    if (tila == 'o') {
        switch (nappi) {
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
        }
    } else 
    // game over
    if (tila == 'g') {
        switch (nappi) {
            case 'ArrowUp':
                break;
            case 'ArrowDown':
                break;
        }
    } else 
    // pelitila
    if (tila == 'p') {
        switch (nappi) {
            case 'ArrowUp':
                if (!pelaaja.hyppyKaynnissa) {
                    pelaaja.hyppyKaynnissa = true;
                    pelaaja.nopeus.y = -8;
                    // vaihdetaan puolta jos pelaaja ei ole aidan takana, muussa tapauksessa ei vaihdeta puolta
                    pelaaja.vaihdetaanPuolta = (pelaaja.aidanTakana == false) ? true : false;
                }
            break;
            case 'ArrowDown':
                if (!pelaaja.hyppyKaynnissa) {
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
    console.log('onload');
    document.getElementById('odota').style.display = 'none';
    document.getElementById('kanvaasi').style.opacity = 1;
    
    /* laskeSkaala();  */
    // Tarkistetaan tukeeko laite kosketusta
    if (navigator.maxTouchPoints > 0) {
        touch = true;
        document.querySelector('#info').style.display = 'block';
        laskenappienpaikka();
    }

    window.addEventListener('resize',laskenappienpaikka);
    screen.orientation.addEventListener('change', laskenappienpaikka);

    // luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen
    taustat = [
        // kaikki taustakuvat on yhdessä kuvatiedostossa (taustat.png)
        // parametrit: taustakuvan yläkulman x, taustakuvan yläkulman y, taustakuvan leveys, taustakuvan korkeus, kuvan sijoittuminen näytölle, nopeuskerroin
        new Tausta(0,0,1024,288,0,0),
        // negatiivinen kuvan sijoittumistieto (y-koordinaatti )tulkitaan siten, että siitä vähennetään kuvan korkeus
        // -canvas.height+25 = canvasin korkeus - kuvan korkeus - 25 (25 on viimeksi piirrettävän "taustan" korkeus)
        new Tausta(0,288,1920,400,-canheight+25,0.2), //harmaat rakennukset
        new Tausta(0,688,1920,420,-canheight+25,0.4), //muut rakennukset
        new Tausta(0,1108,1920,310,-canheight+25,0.6) //puut 
    ];

    lahinTausta = new Tausta(0,1418,1920,25,-canheight,1.1); // keltainen maa 

    lintu2 = new Lintu2(); // musta lintu

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
        if (this.paikka.x + this.leveys > canwidth + 1000) { // lukua muuttamalla lintu pysyy näkymättömissä
            this.paikka.x = -210;
        }
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

            /* piirretään kaikki taustat (paitsi katsojaa lähinnä oleva) siinä järjestyksessä kuin ne ovat arrayssa */
            taustat.forEach((tausta) => {
                tausta.piirra(pelaaja.nopeus.x);
            });

            // Aitojen ja pelaajan hahmon piirtäminen
            // Onko hahmo aidan takana?
            if (pelaaja.aidanTakana) {
                // hahmo on aidan takana, piirretään se ensin
                pelaaja.paivita();
                aidat.forEach((aita) => {
                    aita.paivita();
                });
            } else {
                // hahmo ei ole aidan takana, piirretään aidat ensin
                aidat.forEach((aita) => {
                    aita.paivita();
                });
                pelaaja.paivita();
            }

            /* piirretään lähin tausta, keltainen maa */
            lahinTausta.piirra(pelaaja.nopeus.x);

            lintu2.paivita();
            lintu2.piirra();

            if (tila == 'a') {
                // aloitusruudun piirtäminen
                if (fontOK) {
                    ctx.fillStyle = 'black';
                    ctx.font = '32px "Henny Penny"';
                    ctx.textAlign = 'center';
                    ctx.fillText('Terttu ja Mika', canwidth / 2, 35)
                    ctx.fillText('esittävät pelin', canwidth / 2, 80)
                    ctx.font = '48px "Henny Penny"';
                    ctx.fillText('Mennään siitä mistä aita on matalin',canwidth / 2, 80+60);
                }
            } else
            if (tila == 'p') {
                let luku = Math.round(pistemaara / 10), pmaara;
                if (luku < 0) {
                    pistemaara = 0;
                    luku = 0;
                    pelaaja.kaatuu = true;
                    pelaaja.kuvarivi = 4;
                    pelaaja.framelaskuri = 0;
                    pelaaja.nykyinenFrame = 0;
                    pelaaja.nopeus.x = 3;
                }
                pmaara = luku.toString();

                while (pmaara.length < 6) {
                    pmaara = '0' + pmaara;
                }

                ctx.fillStyle = (pistelisays > 0) ? 'green' : 'red';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pmaara,canwidth / 2, 32);

            } // end pelitila
        }
    }
}