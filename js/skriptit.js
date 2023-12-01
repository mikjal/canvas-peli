const canvas = document.querySelector('#kanvaasi');
const ctx = canvas.getContext("2d");

let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let pistemaara = 0, pistelisays = 0, painovoima = 0.5;

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
        this.yOffsets = hahmot[id].yOffsetit; // Hahmon kuvan säätäminen eri animaatioissa y-suunnassa
        this.kuvarivi = 0; // Mitä "animaatiorivä" käytetään
        this.saaPiirtaa = false; // Milloin hahmon saa piirtää ja milloin ei (=hahmon kuvan latautuessa)
        // Määritetään hahmon kuvaan liittyviä ominaisuuksia vasta kun kuva on latautunut
        this.kuva.onload = () => {
            this.leveys = this.kuva.width / this.kuvanFramet; // Yhden animaatioruudun leveys
            this.korkeus = this.kuva.height / 5; // Kaikissa kuvatiedostoissa on 5 eri "riviä" animaatioita
            this.piirtopaikka = { // hahmon piirtopaikka
                x: Math.round(canvas.width / 2 - this.leveys / 2 + this.xOffset),
                y: canvas.height - this.korkeus
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
                this.piirtopaikka.y - this.yOffsets[this.kuvarivi] + this.paikka.y, // Destination: y
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
        return false;
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
            // TARKASTA! oli alunperin this.paikka.y >= 0 && this.hyppyKaynnissa
            if (this.paikka.y <= 0 && this.hyppyKaynnissa) {
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
} // end class Pelaaja

let pelaaja = new Pelaaja(0);

// Odotetaan että sivu on latautunut ja kaikki sen resurssit on latautunut
window.onload = () => {
    document.getElementById('odota').style.display = 'none';
    document.getElementById('kanvaasi').style.opacity = 1;

    // luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen
    taustat = [
        // kaikki taustakuvat on yhdessä kuvatiedostossa (taustat.png)
        // parametrit: taustakuvan yläkulman x, taustakuvan yläkulman y, taustakuvan leveys, taustakuvan korkeus, kuvan sijoittuminen näytölle, nopeuskerroin
        new Tausta(0,0,1024,288,0,0),
        // negatiivinen kuvan sijoittumistieto (y-koordinaatti )tulkitaan siten, että siitä vähennetään kuvan korkeus
        // -canvas.height+25 = canvasin korkeus - kuvan korkeus - 25 (25 on viimeksi piirrettävän "taustan" korkeus)
        new Tausta(0,288,1920,400,-canvas.height+25,0.2), //harmaat rakennukset
        new Tausta(0,688,1920,420,-canvas.height+25,0.4), //muut rakennukset
        new Tausta(0,1108,1920,310,-canvas.height+25,0.6) //puut
    ];

    lahinTausta = new Tausta(0,1418,1920,25,-canvas.height,1.1); // keltainen maa

    lintu2 = new Lintu2(); // musta lintu

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
        if (this.kuva.leveys + piirtopaikka < canvas.width) {
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
        this.korkeus = 590; // Pienennetty korkeus
        this.paikka = {
            x: -210,  // Aseta linnun alku sivun vasempaan reunaan
            y: canvas.height - this.korkeus
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
        if (this.paikka.x + this.leveys > canvas.width +150) {
            this.paikka.x = 0;
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
            ctx.fillRect(0,0,canvas.width,canvas.height);

            /* piirretään kaikki taustat (paitsi katsojaa lähinnä oleva) siinä järjestyksessä kuin ne ovat arrayssa */
            taustat.forEach((tausta) => {
                tausta.piirra(pelaaja.nopeus.x);
            });

            pelaaja.paivita();
            pelaaja.nopeus.x = 5;

            /* piirretään lähin tausta, keltainen maa */
            lahinTausta.piirra(pelaaja.nopeus.x);

            lintu2.paivita();
            lintu2.piirra();

        }
    }
}