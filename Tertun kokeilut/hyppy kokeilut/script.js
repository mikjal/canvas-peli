const canvas = document.getElementById("gameCanvas");
const context = gameCanvas.getContext("2d");

//ctx.fillStyle = "red";
//ctx.fillRect(20, 20, 150, 100);

const odota = document.getElementById("odota");

function showOdota() {
    odota.style.display = "block";
}

function hideOdota() {
    odota.style.display ="none";
}

showOdota();

// Asettaa canvas-koon
canvas.width = 1024;
canvas.height = 567;

const characterImg = new Image();
characterImg.src = 'kissa-hyppaaUusin.png';
characterImg.classList.add('animated-image');

const characterSprite = {
    image: characterImg,
    frameWidth: 258, // Kuvan leveys
    frameHeight: 268, // Kuvan korkeus
    numberOfFrames: 10, // Kuvan animaatiokehyksien lukumäärä
    currentFrame: 0, // Nykyinen kehys
    animationSpeed: 0.2 // Animaation nopeus
};

const fenceImg = new Image();
fenceImg.src = 'tiiliaita.png';


const character = {
    x: 50,
    y: canvas.height - 250,
    width: 100,
    height: 180,
    //color: "blue",
    jumping: false,
    jumpHeight: 150,
    jumpCount: 0
};

/*const fence = {
    x: 0,
    y: canvas.height - 5,
    width: canvas.width,
    height: 50,
    color: "brown"
};*/

class Tausta {
    constructor() {
    this.img = new Image();
    this.img.src = 'taustaLinnut4.png';
    this.x = 0;
    this.y = 0;
    this.nopeus = 1; // Säädä nopeutta tarpeen mukaan
    }

    liiku() {
        this.x -= this.nopeus;
        if (this.x <= -canvas.width) {
            this.x = 0;
        }
    }

    piirra() {
        context.drawImage(this.img, this.x, this.y, canvas.width, canvas.height);
        context.drawImage(this.img, this.x + canvas.width, this.y, canvas.width, canvas.height);
    }
};

const tausta = new Tausta();

const aita = {
    aidat: [
        { x: 0, korkeus: 60 },
        { x: 200, korkeus: 60 },
        { x: 400, korkeus: 80 },
        { x: 600, korkeus: 80 },
        { x: 800, korkeus: 170 },
        { x: 1000, korkeus: 60 },
        
        // Lisää tarvittaessa muita aitaelementtejä
    ],
    leveys: 200, // Aidan leveys
    korkeus: 100,  // Aidan korkeus
    nopeus: 3 // Aidan liikkumisnopeus
};

let characterBehindFence = false;
    
function drawCharacter() {
    const { image, frameWidth, frameHeight, numberOfFrames, currentFrame } = characterSprite;

    // Säätelee kuinka usein piirretään uusi kehys
    if (Math.floor(characterSprite.currentFrame) < numberOfFrames) {
            context.drawImage(
                image,
                Math.floor(currentFrame) * frameWidth,
                0,
                frameWidth,
                frameHeight,
                character.x,
                character.y,
                character.width,
                character.height
    );

    characterSprite.currentFrame += characterSprite.animationSpeed;

    if (characterSprite.currentFrame >= numberOfFrames) {
        characterSprite.currentFrame = 0;
    }
    }
}

function drawFence() {
    // context.fillStyle = fence.color;
    //context.fillRect(fence.x, fence.y, fence.width, fence.height);
    for (let i = 0; i < aita.aidat.length; i++) {
        context.drawImage(fenceImg, aita.aidat[i].x, canvas.height - aita.aidat[i].korkeus - 20, aita.leveys, aita.aidat[i].korkeus);
    }
}

function drawGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Liikuta taustaa oikealta vasemmalle
    tausta.liiku();
    tausta.piirra();

    // Liikuta aitaa oikealta vasemmalle
    for (let i = 0; i < aita.aidat.length; i++) {
        aita.aidat[i].x -= aita.nopeus;

        // Tarkista, onko aitaelementti kokonaan näytön vasemman reunan ulkopuolella
        if (aita.aidat[i].x + aita.leveys <= 0) {
            // Aseta aitaelementti takaisin näytön oikeaan reunaan
            aita.aidat[i].x = canvas.width;
        }
    }

    // Piirretään ensin aita
    drawFence();

    // Päivitä hahmon sijaintia
    if (character.jumping) {
        character.y -= 5;
        character.jumpCount += 5;

        if (character.jumpCount >= character.jumpHeight) {
            character.jumping = false;
            character.jumpCount = 0;

            // Kun hyppy päättyy, päätetään onko hahmo aidan takana vai edessä
            characterBehindFence = !characterBehindFence;
        }
    } else if (character.y < canvas.height - character.height) {
        character.y += 5;
    }

    // Piirretään sitten hahmo aidan takana tai edessä
    if (characterBehindFence) {
        drawFence();  // Piirretään ensin aita
        drawCharacter();  // Piirretään sitten hahmo
    } else {
        drawCharacter();  // Piirretään ensin hahmo
        drawFence();  // Piirretään sitten aita
    }
    hideOdota();
}
    
function jump() {
    if (!character.jumping && character.y >= canvas.height - character.height) {
        character.jumping = true;
        // Tallenna alkuperäinen y-koordinaatti hyppäämisen alussa
        character.originalY = character.y;
    }
    if (character.jumping) {
        character.y -= 5;
        character.jumpCount += 5;

        if (character.jumpCount >= character.jumpHeight) {
            character.jumping = false;
            character.jumpCount = 0;
            // Palauta alkuperäinen y-koordinaatti hyppäämisen lopussa
            character.y = character.originalY;
        }
    } else if (character.y < canvas.height - character.height) {
        character.y += 5;
    }
}

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        jump();
    }   
});

setInterval(drawGame, 1000 / 60);
    