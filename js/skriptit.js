const canvas = document.querySelector('#kanvaasi');
const ctx = canvas.getContext("2d");

let vanhaAika = 0; // Ruudunpäivityksen ajastukseen
let kuvatKaytettavissa = [false], aloitusajat = [0], d = new Date();

// Taustakuvat
const taustakuvat = new Image();
taustakuvat.src = '../kuvat/taustat.png';

let taustat = [] // taustakuvia varten

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
        new Tausta(0,688,1920,420,-canvas.height+25,0.3), //muut rakennukset
        new Tausta(0,1108,1920,310,-canvas.height+25,0.5) //puut
    ];

    lahinTausta = new Tausta(0,1418,1920,25,-canvas.height,1.1); // keltainen maa

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
    piirra() {
        // Piirretään taustakuva
        ctx.drawImage(taustakuvat,
            this.kuva.x,this.kuva.y,this.kuva.leveys,this.kuva.korkeus, // Source
            this.piirtopaikka.x, this.piirtopaikka.y, this.kuva.leveys, this.kuva.korkeus // Destination
        );

        // Lasketaan uusi piirtopaikka: 
        // nykyisestä piirtopaikasta vähennetään pelaajan nopeus*nopeuskerroin --> kuva siirtyy vasemmalle
        // this.piirtopaikka.x -= Math.round(this.nopeuskerroin*pelaajanNopeus);

        this.piirtopaikka.x -= this.nopeuskerroin*1; // 1 = pelaajanNopeus
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
                tausta.piirra(); //pelaajan.nopeus.x
            });

            /* piirretään lähin tausta, keltainen maa */
            lahinTausta.piirra(); //pelaaja.nopeus.x



        }
    }
}