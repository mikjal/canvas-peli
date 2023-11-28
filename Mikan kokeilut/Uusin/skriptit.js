const canvas = document.querySelector('#kanvas');
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'medium';

const taustakuva = new Image();
taustakuva.src = 'taustat.png';

let taustat = [], vanha = 0, painovoima = 0.5, hahmoid = 0, pistemaara = 0, pistelisays = 50;
// radan aidat, 0 = ei aitaa, 1 = puuaita, 2 = tiiliaita, 3= tiiliaidan pääty
// HUOM! Alkuun aina 3 kpl nollaa ja 2 jälkeen aina 3 että tiiliaita päättyy siististi!
let aitaelementit =  [0,0,0,1,1,1,1,1,1,1,1,1,1,2,2,3,1,1,2,3,1,2,3,1];
let aidat = [];
// "aitaelementtien" leveydet (tyhjä = 300, puuaita = 142, tiiliaita = 220, tiiliaidan pääty = 29)
const elementtienpituudet = [220, 142, 220, 29];
// jos samaa elementtiä on monta peräkkäin, montako pikseliä seuraava kuva menee edellisen päälle?
const elementtienoffsetit = [0,2,0,0]; 

class Aita {
    constructor(tyyppi,xpos,pituus) {
        this.tyyppi = tyyppi;
        this.yOffset = 0;
        this.kuva = {
            // puuaidan kuvan vasemman reunan x-koordinaatti taustat.png:ssä  on 1180
            // tiiliaidan kuvan vasemman reunan x-koordinaatti on 1335
            x: (this.tyyppi == 1) ? 1180 : 1335, 
            y: 0,
            leveys: pituus,
            // puuaidan korkeus on 80 ja tiiliaidan 118
            korkeus: (this.tyyppi == 1) ? 80 : 118,
        }
        this.paikka = {
            x: xpos,
            y: canvas.height - this.yOffset - this.kuva.korkeus - 25
        }
        this.nakyvilla = false;
        this.piirtopaikka = 0;
    }

    piirra() {
        this.piirtopaikka = this.paikka.x+pelaaja.piirtopaikka.x-pelaaja.paikka.x;
        
        // tarkastetaan onko aidan osa näkyvissä, jos on piirretään se
        if (this.piirtopaikka+this.kuva.leveys >= 0 && this.piirtopaikka <= canvas.width) {
            if (this.tyyppi != 0) {
                ctx.drawImage(taustakuva,
                    this.kuva.x,this.kuva.y,this.kuva.leveys,this.kuva.korkeus, // Source
                    this.piirtopaikka, this.paikka.y, this.kuva.leveys, this.kuva.korkeus // Destination
                );
                this.nakyvilla = true;
            } else this.nakyvilla = false;

        }
        
    }

    paivita() {
        this.piirra();
        this.x += pelaaja.nopeus.x;
    }

    osuuko(pelaajanHahmoAlkaa,pelaajanHahmoPaattyy) {
        if (!this.nakyvilla || this.tyyppi == 1) {
            return false
        } else {
            if (pelaajanHahmoPaattyy >= this.piirtopaikka && pelaajanHahmoAlkaa <= this.piirtopaikka+this.kuva.leveys)
                return true;
        }
        

    }
}

let kohta = 0, edellinen = 0;
aitaelementit.forEach((arvo) => {
    // laskuri joka laskee seuraavan elementin paikkaa
    // jos elementti on sama kuin edellinen, vähennetään offset
    if (arvo != 0) {
        kohta = (edellinen == arvo) ? kohta-elementtienoffsetit[arvo] : kohta;
        aidat.push(new Aita(arvo,kohta,elementtienpituudet[arvo]));
        //console.log(arvo,kohta,elementtienpituudet[arvo]);
        kohta += elementtienpituudet[arvo];
    } else { // Arvon on 0
        kohta += elementtienpituudet[0];
    }
    edellinen = arvo;
});

// Hahmojen mukaiset tiedot
const hahmot = [
    // poika
    {
        kuvatiedosto: 'poika.png', // tiedostonimi
        animaatioFrameja: 15, // montako animaatioframea yhdellä kuvatiedoston rivillä (rivejä aina 5)
        xOffsetti: 50, // Hahmon säätäminen x-suunnassa
        yOffsetit: [2,0,0,0,2], // Hahmon säätäminen y-suunnassa eri animaatioissa (paikallaan, kävely, juoksu, hyppy, kaatuminen)
        hitbox: {a: 2, l: 98} // x-suunnan hitboxin offset: a: alkaa, l: loppuu
    },
    // kissa
    {
        kuvatiedosto: 'kissa.png',
        animaatioFrameja: 10,
        xOffsetti: 0,
        yOffsetit: [18,16,16,14,4],
        hitbox: {a: 30, l: 155}
    },
    // dino
    {
        kuvatiedosto: 'dino.png',
        animaatioFrameja: 10,
        xOffsetti: 45,
        yOffsetit: [3,2,2,0,2],
        hitbox: {a: 14, l: 193}
    },
    // joulupukki
    {
        kuvatiedosto: 'joulupukki.png',
        animaatioFrameja: 10,
        xOffsetti: 20,
        yOffsetit: [3,2,2,0,2],
        hitbox: {a: 38, l: 200}
    }
    
]

class Pelaaja {
    constructor(id) {
        console.log(hahmot[id]);
        this.kuva = new Image();
        this.haluttufps = 30;
        this.kuvanframet = hahmot[id].animaatioFrameja;
        this.framekerroin = this.haluttufps / this.kuvanframet;
        this.nykyinenFrame = 0;
        this.yOffsets = hahmot[id].yOffsetit;
        this.xOffset = hahmot[id].xOffsetti;
        this.kuvarivienlkm = 5; // Montako animaatioriviä kuvatiedostossa on?
        this.kuvarivi = 0; // Mitä animaatio-"riviä" käytetään
        this.hyppyKaynnissa = false;
        this.hitbox =
                {
                    alkaa: hahmot[id].hitbox.a,
                    paattyy: hahmot[id].hitbox.l
                }
        this.lakipiste = false;
        this.aidanTakana = false;
        this.vaihdetaanPuolta = false;
        this.hypynFramelaskuri = 0;
        this.edellinenKuvarivi = 0;
        this.saaPiirtaa = false;
        this.kuva.onload = () => {
            // Määritetään hahmon kuvaan liittyviä ominaisuuksia vasta kun kuva on latautunut
            this.leveys = this.kuva.width / this.kuvanframet;
            this.korkeus = this.kuva.height / this.kuvarivienlkm; 
            this.piirtopaikka = {
                x: Math.round(canvas.width / 2 - this.leveys / 2 + this.xOffset),
                y: canvas.height-this.korkeus
            }
            this.saaPiirtaa = true;
        }
        this.kuva.src = hahmot[id].kuvatiedosto;
        this.nopeus = {
            x: 0,
            y: 0
        }
        this.paikka = {
            x: 0,
            y: 0
        }
    }

    vaihdaHahmo(id) {
        this.saaPiirtaa = false;
        this.kuvanframet = hahmot[id].animaatioFrameja;
        this.framekerroin = this.haluttufps / this.kuvanframet;
        this.yOffsets = hahmot[id].yOffsetit;
        this.xOffset = hahmot[id].xOffsetti;
        this.hitbox =
                {
                    alkaa: hahmot[id].hitbox.a,
                    paattyy: hahmot[id].hitbox.l
                }
        this.kuva.onload = () => {
            this.leveys = this.kuva.width / this.kuvanframet;
            this.korkeus = this.kuva.height / this.kuvarivienlkm; 
            this.piirtopaikka = {
                x: Math.round(canvas.width / 2 - this.leveys / 2 + this.xOffset),
                y: canvas.height-this.korkeus
            }
            this.saaPiirtaa = true;
        }
        this.kuva.src = hahmot[id].kuvatiedosto;
    }

    piirra() {
 
        if (this.saaPiirtaa) {
            /* piirretään samaa framea useampaan kertaan peräkkäin että saadaan siitä sekunnin pituinen (15fps --> 30fps) */
            let piirrettavaFrame = Math.floor(this.nykyinenFrame / this.framekerroin); 

            ctx.drawImage(this.kuva,
                piirrettavaFrame*this.leveys,
                this.kuvarivi*this.korkeus,
                this.leveys,
                this.korkeus,
                this.piirtopaikka.x,
                this.piirtopaikka.y-this.yOffsets[this.kuvarivi]+this.paikka.y,
                this.leveys,
                this.korkeus
            );

            this.nykyinenFrame = (this.nykyinenFrame < this.haluttufps-1) ? this.nykyinenFrame += 1 : this.nykyinenFrame = 0;

            if (this.kuvarivi == 3) {
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'red';
            ctx.fillRect(
                this.piirtopaikka.x+this.hitbox.alkaa,
                this.piirtopaikka.y-this.yOffsets[this.kuvarivi]+this.paikka.y,
                this.hitbox.paattyy-this.hitbox.alkaa,
                this.korkeus
            );
            ctx.globalAlpha = 1.0;
            }
        }
    }

    tarkastaOsuma() {
        let osumat = 0;
        aidat.forEach((aita) => {
            if (aita.osuuko(this.piirtopaikka.x+this.hitbox.alkaa,this.piirtopaikka.x+this.hitbox.paattyy)) {
                osumat += 1;
            }
        });
        document.querySelector('#kaatuu').innerText = (osumat == 0) ? 'Ei' : 'Kyllä';

    }

    paivita() {
        
        // Debug: montako framea näytetään hypyn aikana?
        if (this.hyppyKaynnissa) {
            
            // Siirrytään kuvatiedostossa hyppyanimaation riville
            if (this.hypynFramelaskuri > 2 && this.hypynFramelaskuri <= 30 && this.kuvarivi != 3) {
                this.edellinenKuvarivi = this.kuvarivi;
                this.kuvarivi = 3;
            }
            
            if (this.hypynFramelaskuri > 30 && this.kuvarivi == 3) {
                this.kuvarivi = this.edellinenKuvarivi;
            }

            this.hypynFramelaskuri += 1;
            
            //console.log(this.hypynFramelaskuri)
        }


        if (this.nopeus.x != 0) pistelisays -= 0.2;

        //vasenreunaX = this.paikka.x - this.piirtopaikka.x;

        // Nopeuden vaikutus
        this.paikka.x += this.nopeus.x; 
        this.paikka.y += this.nopeus.y;

        // Nopeus y-suunnassa muuttuu painovoiman verran, jos pelaajan y on jotain muuta kuin nolla
        let edellinen = this.nopeus.y;
        this.nopeus.y = (this.paikka.y != 0) ? this.nopeus.y+painovoima : 0;

        // Lakipiste eli onko hyppy korkeimmillaan?
        if (edellinen < 0 && this.nopeus.y >= 0) {
            this.lakipiste = true;
            // Vaihdetaanko puolta?
            //this.aidanTakana = (this.vaihdetaanPuolta == true) ? !this.aidanTakana : this.aidanTakana;
            if (this.vaihdetaanPuolta) {
                this.aidanTakana = !this.aidanTakana;
                pistelisays = 50;
            }
        }
        // Ollaanko "maan" tasolla?
        if (this.paikka.y >= 0 && this.hyppyKaynnissa) {
            this.hyppyKaynnissa = false;
            this.vaihdetaanPuolta = false;
            this.lakipiste = false;
            this.nopeus.y = 0;
            
            this.hypynFramelaskuri = 0;
        }

        this.piirra();

        this.tarkastaOsuma();

        if (this.nopeus.x != 0) pistemaara += pistelisays;

    }
}

let pelaaja = new Pelaaja(0);
//const pelaaja = new Pelaaja(1);

class Tausta {
    constructor(x,y,leveys,korkeus,yOffset,nopeuskerroin) {
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
        ctx.drawImage(taustakuva,
            this.kuva.x,this.kuva.y,this.kuva.leveys,this.kuva.korkeus, // Source
            this.piirtopaikka.x, this.piirtopaikka.y, this.kuva.leveys, this.kuva.korkeus // Destination
        );

        // Lasketaan uusi piirtopaikka: 
        // nykyisestä piirtopaikasta vähennetään pelaajan nopeus*nopeuskerroin --> kuva siirtyy vasemmalle
        //this.piirtopaikka.x -= Math.round(this.nopeuskerroin*pelaajanNopeus);

        this.piirtopaikka.x -= this.nopeuskerroin*pelaajanNopeus;
        let piirtopaikka = Math.round(this.piirtopaikka.x)

        // Loppuuko kuvasta leveys, pitääkö piirtää toinen kuva ensimmäisen perään?
        if (this.kuva.leveys + piirtopaikka < canvas.width) {
            // Kyllä, piirretään toinen kuva ensimmäisen perään
            ctx.drawImage(taustakuva,
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

/* odotetaan että sivu on latautunut */
window.onload = () => {

    // luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen
    taustat = [
        // kaikki taustakuvat on yhdessä kuvatiedostossa (taustat.png)
        // parametrit: taustakuvan yläkulman x, taustakuvan yläkulman y, taustakuvan leveys, taustakuvan korkeus, kuvan sijoittuminen näytölle, nopeuskerroin
        new Tausta(0,0,1024,288,0,0),
        // negatiivinen kuvan sijoittumistieto (y-koordinaatti )tulkitaan siten, että siitä vähennetään kuvan korkeus
        // -canvas.height+25 = canvasin korkeus - kuvan korkeus - 25 (25 on viimeksi piirrettävän "taustan" korkeus)
        new Tausta(0,288,1920,400,-canvas.height+25,0.2),
        new Tausta(0,688,1920,420,-canvas.height+25,0.3),
        new Tausta(0,1108,1920,310,-canvas.height+25,0.5)
    ];

    lahinTausta = new Tausta(0,1418,1920,25,-canvas.height,1.1);

    let nopeudet = [0,3,6,6,0];

    window.addEventListener('keydown', (evnt) => {
        if (evnt.key == 'ArrowUp' || evnt.code == 'ArrowUp') {
            if (pelaaja.hyppyKaynnissa == false) {
                pelaaja.hyppyKaynnissa = true;
                pelaaja.nopeus.y = -8;
                // vaihdetaan puolta jos pelaaja ei ole aidan takana, muussa tapauksessa ei vaihdeta puolta
                pelaaja.vaihdetaanPuolta = (pelaaja.aidanTakana == false) ? true : false;
            }
        }

        if (evnt.key == 'ArrowDown' || evnt.code == 'ArrowDown') {
            if (pelaaja.hyppyKaynnissa == false) {
                pelaaja.hyppyKaynnissa = true;
                pelaaja.nopeus.y = -8;
                // vaihdetaan puolta jos pelaaja on aidan takana, muussa tapauksessa ei vaihdeta puolta
                pelaaja.vaihdetaanPuolta = (pelaaja.aidanTakana == true) ? true : false;
            }
        }

        if (evnt.key == 'ArrowRight' || evnt.code == 'ArrowRight') {
            if (pelaaja.kuvarivi < pelaaja.kuvarivienlkm-1) {
                pelaaja.kuvarivi += 1;
                pelaaja.nopeus.x = nopeudet[pelaaja.kuvarivi];
                if (pelaaja.kuvarivi > 2) pelaaja.nykyinenFrame = 0;
            }
        }

        if (evnt.key == 'ArrowLeft' || evnt.code == 'ArrowLeft') {
            if (pelaaja.kuvarivi > 0) {
                pelaaja.kuvarivi -= 1;
                pelaaja.nopeus.x = nopeudet[pelaaja.kuvarivi];
                if (pelaaja.kuvarivi > 2) pelaaja.nykyinenFrame = 0;
            }
        }

        if (evnt.key == 'c' || evnt.key == 'C') {
            hahmoid = (hahmoid+1 < hahmot.length) ? hahmoid += 1 : 0;
            pelaaja.vaihdaHahmo(hahmoid);
        }


    });

    animoi();
}

function animoi(aika) {
    window.requestAnimationFrame(animoi);

    fps = Math.round(1000 / (aika-vanha));
    if (Number.isInteger(fps)) {
        if (fps <= 30) { /* max. 30 fps */

            // Debug
            document.querySelector('#ftime').innerText = fps;
            vanha = aika;
            
            /* taivas */
            ctx.fillStyle = 'skyblue';
            ctx.fillRect(0,0,canvas.width,canvas.height);
           
            /* piirretään kaikki taustat (paitsi katsojaa lähinnä oleva) siinä järjestyksessä kuin ne ovat arrayssa */
            taustat.forEach((tausta) => {
                tausta.piirra(pelaaja.nopeus.x);
            });

            // Aita ja pelaajan hahmo
            if (pelaaja.aidanTakana == true) {
                pelaaja.paivita();
                aidat.forEach((aita) => {
                    aita.paivita();
                });
            } else {
                aidat.forEach((aita) => {
                    aita.paivita();
                });
                pelaaja.paivita();
            }

            /* piirretään alin tausta */
            lahinTausta.piirra(pelaaja.nopeus.x);

            let luku = Math.round(pistemaara / 10);
            let pmaara = (luku < 0) ? '0' : luku.toString();

            while (pmaara.length < 6) {
                pmaara = '0' + pmaara;
            }

            ctx.fillStyle = (pistelisays > 0) ? 'black' : 'red';
            ctx.font = '32px Arial';
            ctx.fillText(pmaara,canvas.width/2-40,32);

            // Debug
            document.querySelector('#paikka').innerText = pelaaja.paikka.x + ', ' +pelaaja.paikka.y;
            document.querySelector('#nopeus').innerText = pelaaja.nopeus.x + ', ' +pelaaja.nopeus.y;
            document.querySelector('#vpuoli').innerText = (pelaaja.vaihdetaanPuolta == false) ? 'Ei' : 'Kyllä';
            document.querySelector('#lakipiste').innerText = (pelaaja.lakipiste == false) ? 'Ei' : 'Kyllä';
            document.querySelector('#takana').innerText = (pelaaja.aidanTakana == false) ? 'Ei' : 'Kyllä';
            document.querySelector('#hyppy').innerText = (pelaaja.hyppyKaynnissa == false) ? 'Ei' : 'Kyllä';

        }

    }
    
}