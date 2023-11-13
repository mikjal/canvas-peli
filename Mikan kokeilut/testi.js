const canvas = document.querySelector('#kanvas');
const ctx = canvas.getContext("2d");
let taustakuvat = [], nopeus = 2;
const taustatiedostot = ['kerros0-1024x288.png','kerros1-1920x400.png','kerros2-1920x420.png','kerros3-1920x310.png','kerros4-1920x50.png'];
const taustapaikat = [0,-canvas.height+50,-canvas.height+50,-canvas.height+50,-canvas.height];
const taustakertoimet = [0,0.2,0.3,0.5,1.1]

let taustat = [];

/* ladataan kaikki taustakuvat */
taustatiedostot.forEach(tnimi => {
   let kuva = new Image;
   kuva.src = tnimi;
   taustakuvat.push(kuva);
});

class Tausta {
    constructor(id, y, kerroin) { 
        this.id = id; /* kuvan nro taustakuvat arrayssa */
        this.y = (y < 0) ? Math.abs(taustakuvat[id].height+y) : y; /* kuvan y-paikka, jos negatiivinen, vähennetään y-paikasta kuvan korkeus */
        this.x = 0; /* kuvan x-paikka alussa */
        this.leveys = taustakuvat[id].width; /* kuvan leveys */
        this.kerroin = kerroin; /* nopeuskerroin verrattuna pelaajan nopeuteen */
    }

    piirra() {
        ctx.drawImage(taustakuvat[this.id],this.x,this.y);
        /* vähennetään x-paikasta nopeus --> kuva siirtyy vasemmalle */
        this.x -= nopeus*this.kerroin;
        /* onko kuva leveys loppumassa? pitääkö piirtää toinen kuva ensimmäisen perään? */
        if (this.leveys+Math.round(this.x)-canvas.width <= 0) {
            /* kyllä, piirretään toista kuvaa ensimmäisen perään */
            ctx.drawImage(taustakuvat[this.id],Math.round(this.x)+this.leveys,this.y);
            /* onko toinen kuva saavuttanut vasemman reunan? */
            if (Math.round(this.x) + this.leveys <= 0) {
                /* kyllä, nollataan x ja piirretään taas vain yhtä kuvaa */
                this.x = Math.round(this.x) + this.leveys;
            }
        }
    }

}

/* odotetaan että sivu on latautunut */
window.onload = () => {

    /* luodaan Tausta-luokan mukaiset oliot kaikille taustoille */
    for (let i=0;i<taustakuvat.length;i++) {
        let tausta = new Tausta(i,taustapaikat[i],taustakertoimet[i]);
        taustat.push(tausta);
    }
    
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
           
            /* piirretään kaikki taustat */
            taustat.forEach(tausta => {
                tausta.piirra();
            });
        }

    }
    
}