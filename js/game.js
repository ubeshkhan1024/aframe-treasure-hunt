let found = 0;
let gameOver = false;

const counter = document.getElementById("counter");
const treasures = document.querySelectorAll(".treasure-hitbox");

const ghost1 = document.getElementById("ghost1");
const ghost2 = document.getElementById("ghost2");

const player = document.getElementById("player");


/* =========================================
   AUDIO
========================================= */

const audioContext =
    new (window.AudioContext || window.webkitAudioContext)();

function resumeAudio() {
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}

function playCollectSound() {

    resumeAudio();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
        700,
        audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
        1000,
        audioContext.currentTime + 0.08
    );

    gain.gain.setValueAtTime(
        0.3,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.3
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.3
    );
}


function playDeathSound() {

    resumeAudio();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "sawtooth";

    oscillator.frequency.setValueAtTime(
        180,
        audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        40,
        audioContext.currentTime + 0.8
    );

    gain.gain.setValueAtTime(
        0.35,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.8
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.8
    );
}


function playWinSound() {

    resumeAudio();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.type = "triangle";

    oscillator.frequency.setValueAtTime(
        500,
        audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
        800,
        audioContext.currentTime + 0.15
    );

    oscillator.frequency.setValueAtTime(
        1100,
        audioContext.currentTime + 0.3
    );

    gain.gain.setValueAtTime(
        0.3,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.8
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 0.8
    );
}


/* =========================================
   TREASURE SYSTEM
========================================= */

treasures.forEach((treasure) => {

    treasure.addEventListener("click", function () {

        if (gameOver) return;

        if (
            treasure.getAttribute("data-found") === "true"
        ) {
            return;
        }

        console.log("💰 TREASURE CLICKED");

        treasure.setAttribute(
            "data-found",
            "true"
        );

        found++;

        playCollectSound();

        const parent =
            treasure.closest(".treasure");

        if (parent) {

            parent.setAttribute(
                "animation",
                "property: scale; to: 0 0 0; dur: 400; easing: easeInQuad"
            );

            setTimeout(() => {

                parent.setAttribute(
                    "visible",
                    "false"
                );

            }, 400);
        }

        counter.innerText =
            `Treasures: ${found} / 3`;


        if (found === 3) {

            setTimeout(() => {

                if (gameOver) return;

                playWinSound();

                document.getElementById(
                    "winScreen"
                ).style.display = "flex";

            }, 600);
        }

    });

});


/* =========================================
   PLAYER / WALL COLLISION
========================================= */

let solidObjects = [];

const PLAYER_RADIUS = 0.45;


function setupCollision() {

    solidObjects =
        Array.from(
            document.querySelectorAll(".solid")
        );

    console.log(
        "🧱 Solid objects:",
        solidObjects.length
    );
}


function checkCollision(x, z) {

    if (!player) {
        return false;
    }

    const playerPosition =
        new THREE.Vector3(
            x,
            player.object3D.position.y,
            z
        );


    for (const object of solidObjects) {

        if (!object.object3D.visible) {
            continue;
        }


        const box =
            new THREE.Box3().setFromObject(
                object.object3D
            );


        box.min.x -= PLAYER_RADIUS;
        box.max.x += PLAYER_RADIUS;

        box.min.z -= PLAYER_RADIUS;
        box.max.z += PLAYER_RADIUS;


        if (
            playerPosition.x >= box.min.x &&
            playerPosition.x <= box.max.x &&
            playerPosition.z >= box.min.z &&
            playerPosition.z <= box.max.z
        ) {

            return true;
        }
    }


    return false;
}


function handlePlayerCollision() {

    if (!player || gameOver) {
        return;
    }


    const position =
        player.object3D.position;


    const currentX = position.x;
    const currentZ = position.z;


    if (
        typeof handlePlayerCollision.lastX !==
        "number"
    ) {

        handlePlayerCollision.lastX =
            currentX;

        handlePlayerCollision.lastZ =
            currentZ;

        return;
    }


    const oldX =
        handlePlayerCollision.lastX;

    const oldZ =
        handlePlayerCollision.lastZ;


    /* Check X movement */

    if (
        checkCollision(
            currentX,
            oldZ
        )
    ) {

        position.x = oldX;

    } else {

        handlePlayerCollision.lastX =
            currentX;
    }


    /* Check Z movement */

    if (
        checkCollision(
            position.x,
            currentZ
        )
    ) {

        position.z = oldZ;

    } else {

        handlePlayerCollision.lastZ =
            currentZ;
    }
}


/* =========================================
   GHOST AI
========================================= */

/*
    Ghosts do NOT chase immediately.

    Player gets 5 seconds of safety after spawn.
*/

const GHOST_START_DELAY = 5000;

const GHOST_DETECTION_RANGE = 12;

const GHOST_SPEED = 3.5;

let ghostAIActive = false;

let ghostTime = 0;


/*
    Activate ghost AI after 5 seconds.
*/

setTimeout(() => {

    if (!gameOver) {

        ghostAIActive = true;

        console.log(
            "👻 Ghosts are now hunting!"
        );
    }

}, GHOST_START_DELAY);


/* =========================================
   UPDATE ONE GHOST
========================================= */

function updateGhost(
    ghost,
    playerPos,
    ghostIndex
) {

    if (!ghost) {
        return;
    }


    const ghostPos =
        ghost.object3D.position;


    const dx =
        playerPos.x - ghostPos.x;

    const dz =
        playerPos.z - ghostPos.z;


    const distance =
        Math.sqrt(
            dx * dx +
            dz * dz
        );


    /* =====================================
       CHASE MODE
    ===================================== */

    if (
        ghostAIActive &&
        distance <= GHOST_DETECTION_RANGE
    ) {

        const length =
            Math.sqrt(
                dx * dx +
                dz * dz
            );


        if (length > 0.01) {

            const directionX =
                dx / length;

            const directionZ =
                dz / length;


            const movement =
                GHOST_SPEED * 0.016;


            ghostPos.x +=
                directionX * movement;

            ghostPos.z +=
                directionZ * movement;


            /*
                Face the player.
            */

            ghost.object3D.rotation.y =
                Math.atan2(
                    directionX,
                    directionZ
                );
        }


        /*
            Chasing floating animation.
        */

        ghostPos.y =
            1.5 +
            Math.sin(
                ghostTime * 4 +
                ghostIndex
            ) * 0.35;


        return;
    }


    /* =====================================
       NORMAL PATROL
    ===================================== */

    if (ghostIndex === 0) {

        /*
            Ghost 1 stays around the
            middle of the dungeon.
        */

        ghostPos.x =
            Math.sin(
                ghostTime * 0.35
            ) * 10;

        ghostPos.z =
            -8 +
            Math.cos(
                ghostTime * 0.35
            ) * 10;

    } else {

        /*
            Ghost 2 has a different patrol.
        */

        ghostPos.x =
            -10 +
            Math.sin(
                ghostTime * 0.45
            ) * 8;

        ghostPos.z =
            -8 +
            Math.cos(
                ghostTime * 0.45
            ) * 8;
    }


    ghostPos.y =
        1.5 +
        Math.sin(
            ghostTime * 2 +
            ghostIndex
        ) * 0.45;
}


/* =========================================
   GHOST MOVEMENT LOOP
========================================= */

function moveGhosts(time) {

    ghostTime =
        time * 0.001;


    if (!player || gameOver) {
        return;
    }


    const playerPos =
        player.object3D.getWorldPosition(
            new THREE.Vector3()
        );


    updateGhost(
        ghost1,
        playerPos,
        0
    );


    updateGhost(
        ghost2,
        playerPos,
        1
    );


    checkGhostCollision();


    requestAnimationFrame(
        moveGhosts
    );
}


/* =========================================
   GHOST COLLISION
========================================= */

function checkGhostCollision() {

    if (!player || gameOver) {
        return;
    }


    const playerPos =
        player.object3D.getWorldPosition(
            new THREE.Vector3()
        );


    /* Ghost 1 */

    if (ghost1) {

        const ghostPos =
            ghost1.object3D.getWorldPosition(
                new THREE.Vector3()
            );

        const distance =
            playerPos.distanceTo(
                ghostPos
            );


        if (distance < 2.2) {

            killPlayer();

            return;
        }
    }


    /* Ghost 2 */

    if (ghost2) {

        const ghostPos =
            ghost2.object3D.getWorldPosition(
                new THREE.Vector3()
            );

        const distance =
            playerPos.distanceTo(
                ghostPos
            );


        if (distance < 2.2) {

            killPlayer();

            return;
        }
    }
}


/* =========================================
   PLAYER DEATH
========================================= */

function killPlayer() {

    if (gameOver) {
        return;
    }


    gameOver = true;

    ghostAIActive = false;


    console.log(
        "💀 PLAYER KILLED"
    );


    playDeathSound();


    if (player) {

        player.setAttribute(
            "wasd-controls",
            "enabled: false"
        );
    }


    const deathScreen =
        document.createElement("div");


    deathScreen.id =
        "deathScreen";


    deathScreen.innerHTML = `
        <div class="deathBox">

            <h1>💀 YOU DIED</h1>

            <p>
                A ghost caught you...
            </p>

            <button onclick="location.reload()">
                TRY AGAIN
            </button>

        </div>
    `;


    deathScreen.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 10000;

        display: flex;
        justify-content: center;
        align-items: center;

        text-align: center;

        background: rgba(0,0,0,0.94);

        color: white;

        font-family: Arial, sans-serif;
    `;


    const box =
        deathScreen.querySelector(
            ".deathBox"
        );


    box.style.cssText = `
        padding: 45px;

        min-width: 320px;

        background: #15151d;

        border: 2px solid #ff2222;

        border-radius: 20px;

        box-shadow:
            0 0 35px rgba(255,0,0,0.4),
            inset 0 0 30px rgba(255,0,0,0.05);
    `;


    const title =
        deathScreen.querySelector("h1");


    title.style.cssText = `
        color: #ff3333;

        font-size: 44px;

        margin-bottom: 15px;
    `;


    const text =
        deathScreen.querySelector("p");


    text.style.cssText = `
        color: #bbb;

        font-size: 18px;

        margin-bottom: 25px;
    `;


    const button =
        deathScreen.querySelector(
            "button"
        );


    button.style.cssText = `
        padding: 14px 30px;

        border: none;

        border-radius: 10px;

        background: #ff3333;

        color: white;

        font-size: 18px;

        font-weight: bold;

        cursor: pointer;
    `;


    document.body.appendChild(
        deathScreen
    );
}


/* =========================================
   TORCH LIGHT FLICKER
========================================= */

const torchLight =
    document.getElementById("torchLight");


function flickerTorch() {

    if (torchLight) {

        const intensity =
            4.5 +
            Math.random() * 2.0;

        torchLight.setAttribute(
            "intensity",
            intensity
        );
    }


    setTimeout(
        flickerTorch,
        80 + Math.random() * 120
    );
}


/* =========================================
   MAIN GAME LOOP
========================================= */

function gameLoop() {

    if (!gameOver) {

        handlePlayerCollision();

    }


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================
   START GAME
========================================= */

function startGame() {

    console.log(
        "👻 Haunted Treasure Hunt started"
    );


    console.log(
        "💰 Treasures:",
        treasures.length
    );


    console.log(
        "👻 Ghost 1:",
        ghost1 ? "FOUND" : "MISSING"
    );


    console.log(
        "👻 Ghost 2:",
        ghost2 ? "FOUND" : "MISSING"
    );


    /*
        Setup wall collision.
    */

    setupCollision();


    /*
        Start player collision.
    */

    requestAnimationFrame(
        gameLoop
    );


    /*
        Start ghost movement.
    */

    requestAnimationFrame(
        moveGhosts
    );


    /*
        Start torch flickering.
    */

    flickerTorch();
}


/* =========================================
   WAIT FOR A-FRAME
========================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startGame
    );

} else {

    startGame();
}