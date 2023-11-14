const canvas = document.querySelector('#kanvas');
const ctx = canvas.getContext("2d");
let taustat = [], nopeus = 4;

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

    piirra() {
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

/* luodaan Tausta-luokan mukaiset oliot kaikille taustoille */
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

let vanha = 0;

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
           
            /* piirretään kaikki taustat siinä järjestyksessä kuin ne ovat arrayssa */
            taustat.forEach(tausta => {
                tausta.piirra();
            });
        }

    }
    
}