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
    oscillator.stop(audioContext.currentTime + 0.3);
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
    oscillator.stop(audioContext.currentTime + 0.8);
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
    oscillator.stop(audioContext.currentTime + 0.8);
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
   WALL COLLISION
========================================= */

const PLAYER_RADIUS = 0.45;

let solidObjects = [];


/*
    Store the player's last safe position.
*/

let lastSafeX = null;
let lastSafeZ = null;


/*
    Create collision list.
*/

function setupCollision() {

    solidObjects = Array.from(
        document.querySelectorAll(".solid")
    );

    console.log(
        "🧱 COLLISION OBJECTS:",
        solidObjects.length
    );

    solidObjects.forEach((object, index) => {

        console.log(
            index,
            object.id || object.tagName,
            object.getAttribute("position")
        );

    });
}


/*
    Get the world-space bounding box
    of an object.
*/

function getObjectBox(object) {

    if (!object || !object.object3D) {
        return null;
    }

    const box = new THREE.Box3();

    box.setFromObject(
        object.object3D
    );

    return box;
}


/*
    Check player against all solid objects.
*/

function isColliding(x, z) {

    if (!player) {
        return false;
    }


    for (const object of solidObjects) {

        if (!object.object3D.visible) {
            continue;
        }


        const box =
            getObjectBox(object);


        if (!box) {
            continue;
        }


        /*
            Expand collision box around
            the player.
        */

        const minX =
            box.min.x - PLAYER_RADIUS;

        const maxX =
            box.max.x + PLAYER_RADIUS;

        const minZ =
            box.min.z - PLAYER_RADIUS;

        const maxZ =
            box.max.z + PLAYER_RADIUS;


        if (
            x >= minX &&
            x <= maxX &&
            z >= minZ &&
            z <= maxZ
        ) {

            return true;
        }
    }


    return false;
}


/*
    PLAYER COLLISION LOOP
*/

function updatePlayerCollision() {

    if (!player || gameOver) {
        return;
    }


    const position =
        player.object3D.position;


    const currentX = position.x;
    const currentZ = position.z;


    /*
        Initialize safe position.
    */

    if (
        lastSafeX === null ||
        lastSafeZ === null
    ) {

        lastSafeX = currentX;
        lastSafeZ = currentZ;

        return;
    }


    /*
        Check entire current position.
    */

    if (
        isColliding(
            currentX,
            currentZ
        )
    ) {

        /*
            Try keeping X but restoring Z.
        */

        if (
            !isColliding(
                currentX,
                lastSafeZ
            )
        ) {

            position.z = lastSafeZ;

            lastSafeX = currentX;

            return;
        }


        /*
            Try keeping Z but restoring X.
        */

        if (
            !isColliding(
                lastSafeX,
                currentZ
            )
        ) {

            position.x = lastSafeX;

            lastSafeZ = currentZ;

            return;
        }


        /*
            Both directions collide.
            Restore completely.
        */

        position.x = lastSafeX;
        position.z = lastSafeZ;

        return;
    }


    /*
        Position is safe.
    */

    lastSafeX = currentX;
    lastSafeZ = currentZ;
}


/* =========================================
   GHOST AI
========================================= */

const GHOST_START_DELAY = 5000;
const GHOST_DETECTION_RANGE = 8;
const GHOST_SPEED = 1.8;

let ghostAIActive = false;
let ghostTime = 0;


setTimeout(() => {

    if (!gameOver) {

        ghostAIActive = true;

        console.log(
            "👻 GHOSTS ARE NOW HUNTING"
        );
    }

}, GHOST_START_DELAY);


/*
    Update individual ghost.
*/

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


    /*
        CHASE
    */

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


            ghost.object3D.rotation.y =
                Math.atan2(
                    directionX,
                    directionZ
                );
        }


        ghostPos.y =
            1.5 +
            Math.sin(
                ghostTime * 4 +
                ghostIndex
            ) * 0.35;


        return;
    }


    /*
        PATROL
    */

    if (ghostIndex === 0) {

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


/*
    Ghost animation loop.
*/

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
   TORCH LIGHT
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
   MAIN LOOP
========================================= */

function gameLoop() {

    if (!gameOver) {

        updatePlayerCollision();

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


    setupCollision();


    /*
        Save initial spawn position.
    */

    if (player) {

        lastSafeX =
            player.object3D.position.x;

        lastSafeZ =
            player.object3D.position.z;
    }


    /*
        Start collision.
    */

    requestAnimationFrame(
        gameLoop
    );


    /*
        Start ghosts.
    */

    requestAnimationFrame(
        moveGhosts
    );


    /*
        Start torch.
    */

    flickerTorch();
}


/* =========================================
   WAIT FOR SCENE
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