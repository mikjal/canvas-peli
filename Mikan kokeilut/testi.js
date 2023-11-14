const canvas = document.querySelector('#kanvas');
const ctx = canvas.getContext("2d");
let taustat = [], vanha = 0;

class Pelaaja {
    constructor(kuvatiedosto) {
        this.kuva = new Image();
        this.frameja = 30;
        this.nykyinenFrame = 0;
        this.yOffset = 25;
        this.xOffset = 50;
        
        this.kuva.onload = () => {
            this.leveys = this.kuva.width / this.frameja;
            this.korkeus = this.kuva.height;
            this.paikka = {
                x: canvas.width / 2 - this.leveys / 2 + this.xOffset,
                y: canvas.height-this.korkeus-this.yOffset
            }
    
        }
        this.kuva.src = kuvatiedosto;
        this.nopeus = {
            x: 0,
            y: 0
        }
    }

    piirra() {
        ctx.drawImage(this.kuva,
            this.nykyinenFrame*this.leveys,
            0,
            this.leveys,
            this.korkeus,
            this.paikka.x,
            this.paikka.y,
            this.leveys,
            this.korkeus);
        this.nykyinenFrame = (this.nykyinenFrame < this.frameja-1) ? this.nykyinenFrame += 1 : 0;
    }

    paivita() {
        
        this.piirra();

    }
}

const pelaaja = new Pelaaja('flatboy-idle.png');


class Tausta {
    constructor(kuvatiedosto, yPaikka, kerroin) { 
        this.kuva = new Image();
        this.latautunut = false;
        /* asetetaan kuvaan liittyvä arvot vasta kun se on latautunut */
        this.kuva.onload = () => { 
            this.leveys = this.kuva.width;
            this.korkeus = this.kuva.height;
            /* kuvan y-paikka, jos negatiivinen, vähennetään y-paikasta kuvan korkeus */
            this.y = (yPaikka < 0) ? Math.abs(this.korkeus+yPaikka) : yPaikka; 
            this.latautunut = true;
         };
        this.kuva.src = kuvatiedosto;
        this.x = 0; /* kuvan x-paikka alussa */
        this.kerroin = kerroin; /* nopeuskerroin verrattuna pelaajan nopeuteen */
    }

    piirra(nopeus) {
        ctx.drawImage(this.kuva,this.x,this.y);
        /* vähennetään x-paikasta nopeus*kerroin --> kuva siirtyy vasemmalle */
        this.x -= nopeus*this.kerroin;
        /* onko kuva leveys loppumassa? pitääkö piirtää toinen kuva ensimmäisen perään? */
        if (this.leveys+Math.round(this.x)-canvas.width <= 0) {
            /* kyllä, piirretään toista kuvaa ensimmäisen perään */
            ctx.drawImage(this.kuva,Math.round(this.x)+this.leveys,this.y);
            /* onko toinen kuva saavuttanut vasemman reunan? */
            if (Math.round(this.x) + this.leveys <= 0) {
                /* kyllä, nollataan x ja piirretään taas vain yhtä kuvaa */
                this.x = this.x + this.leveys;
            }
        }
    }

}

/* luodaan Tausta-luokan mukaiset oliot kaikille taustoille, piirretään järjestyksessä ensimmäisestä viimeiseen */
taustat = [ 
    /* Taustan parametrit: tiedostonimi, y-paikka, nopeuskerroin suhteessa pelihahmon nopeuteen*/
    new Tausta('kerros0-1024x288.png',0,0), /* y-paikka = 0 (yläreuna), nopeus = 0 (ei liiku) */
    /* negatiivinen y-paikka tulkitaan siten, että siitä vähennetään kuvan korkeus 
    eli y-paikka = canvasin korkeus - kuvan korkeus - 25 (25 = viimeksi piirrettävän kerroksen korkeus) */
    new Tausta('kerros1-1920x400.png',-canvas.height+25,0.2),
    new Tausta('kerros2-1920x420.png',-canvas.height+25,0.3),
    new Tausta('kerros3-1920x310.png',-canvas.height+25,0.5),
    new Tausta('kerros4-1920x25.png',-canvas.height,1.1)
];


/* odotetaan että sivu on latautunut */
window.onload = () => {

    taustat.forEach(tausta => {
        if (!tausta.latautunut) console.log(tausta.kuvatiedosto+' ei ole latautumut!');
    })
    
    animoi();
}

function animoi(aika) {
    window.requestAnimationFrame(animoi);

    fps = Math.round(1000 / (aika-vanha));
    if (Number.isInteger(fps)) {
        if (fps <= 30) { /* max. 30 fps */
            document.querySelector('#ftime').innerText = fps;
            vanha = aika;
            
            /* taivas */
            ctx.fillStyle = 'skyblue';
            ctx.fillRect(0,0,canvas.width,canvas.height);
           
            let nopeus = pelaaja.nopeus.x;

            /* piirretään kaikki taustat (paitsi näytöllä alin) siinä järjestyksessä kuin ne ovat arrayssa */
            for (let i=0;i<taustat.length-1;i++) {
                taustat[i].piirra(nopeus);
            };

            /* piirretään ja päivitetään pelaajan hahmo */
            pelaaja.paivita();

            /* piirretään alin tausta */
            taustat[taustat.length-1].piirra(nopeus);
        }

    }
    
}