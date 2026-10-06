// ============================================
// HAUNTED TREASURE HUNT - GAME.JS
// ============================================

let found = 0;
let gameOver = false;

const counter = document.getElementById("counter");

// IMPORTANT:
// Your new HTML uses .treasure-hitbox
const treasures = document.querySelectorAll(".treasure-hitbox");

// Ghosts
const ghost1 = document.getElementById("ghost1");
const ghost2 = document.getElementById("ghost2");

// Player camera
const player = document.getElementById("player");


// ============================================
// AUDIO
// ============================================

const audioContext =
    new (window.AudioContext || window.webkitAudioContext)();

function resumeAudio() {
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }
}


// ============================================
// COLLECT SOUND
// ============================================

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


// ============================================
// DEATH SOUND
// ============================================

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


// ============================================
// WIN SOUND
// ============================================

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


// ============================================
// TREASURE COLLECTION
// ============================================

treasures.forEach((treasure) => {

    treasure.addEventListener("click", function () {

        if (gameOver) return;

        console.log("TREASURE CLICKED");

        // Already collected?
        if (
            treasure.getAttribute("data-found") === "true"
        ) {
            return;
        }

        treasure.setAttribute(
            "data-found",
            "true"
        );

        // Increase count
        found++;

        // Sound
        playCollectSound();

        // Find parent treasure
        const parent =
            treasure.closest(".treasure");

        // Hide treasure
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

        // Update HUD
        counter.innerText =
            `Treasures: ${found} / 3`;

        // Win
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


// ============================================
// GHOST MOVEMENT
// ============================================

let ghostTime = 0;

function moveGhosts(time) {

    if (gameOver) {
        requestAnimationFrame(moveGhosts);
        return;
    }

    ghostTime = time * 0.001;


    // ----------------------------------------
    // GHOST 1
    // Large circular roaming area
    // ----------------------------------------

    if (ghost1) {

        const x1 =
            0 +
            Math.sin(ghostTime * 0.45) * 9;

        const z1 =
            -6 +
            Math.cos(ghostTime * 0.45) * 9;

        const y1 =
            1.5 +
            Math.sin(ghostTime * 2) * 0.45;

        ghost1.object3D.position.set(
            x1,
            y1,
            z1
        );

        // Make ghost face movement direction
        ghost1.object3D.rotation.y =
            Math.atan2(
                Math.cos(ghostTime * 0.45),
                -Math.sin(ghostTime * 0.45)
            );
    }


    // ----------------------------------------
    // GHOST 2
    // Different roaming path
    // ----------------------------------------

    if (ghost2) {

        const x2 =
            -6 +
            Math.sin(ghostTime * 0.65) * 12;

        const z2 =
            -2 +
            Math.cos(ghostTime * 0.65) * 7;

        const y2 =
            1.5 +
            Math.sin(ghostTime * 1.7) * 0.55;

        ghost2.object3D.position.set(
            x2,
            y2,
            z2
        );

        ghost2.object3D.rotation.y =
            Math.atan2(
                Math.cos(ghostTime * 0.65),
                -Math.sin(ghostTime * 0.65)
            );
    }


    // Check if ghost touched player
    checkGhostCollision();

    requestAnimationFrame(moveGhosts);
}


// ============================================
// GHOST VS PLAYER
// ============================================

function checkGhostCollision() {

    if (!player || gameOver) return;

    const playerPos =
        player.object3D.getWorldPosition(
            new THREE.Vector3()
        );


    // Ghost 1 collision
    if (ghost1) {

        const ghostPos1 =
            ghost1.object3D.getWorldPosition(
                new THREE.Vector3()
            );

        const distance1 =
            playerPos.distanceTo(ghostPos1);

        if (distance1 < 2.0) {

            killPlayer();
            return;
        }
    }


    // Ghost 2 collision
    if (ghost2) {

        const ghostPos2 =
            ghost2.object3D.getWorldPosition(
                new THREE.Vector3()
            );

        const distance2 =
            playerPos.distanceTo(ghostPos2);

        if (distance2 < 2.0) {

            killPlayer();
            return;
        }
    }
}


// ============================================
// PLAYER DEATH
// ============================================

function killPlayer() {

    if (gameOver) return;

    gameOver = true;

    console.log("PLAYER KILLED BY GHOST");

    playDeathSound();


    // Stop player movement
    if (player) {

        player.setAttribute(
            "wasd-controls",
            "enabled: false"
        );
    }


    // Create death screen
    const deathScreen =
        document.createElement("div");

    deathScreen.id = "deathScreen";

    deathScreen.innerHTML = `
        <div class="deathBox">
            <h1>💀 YOU DIED</h1>
            <p>A ghost caught you...</p>
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
        background: rgba(0, 0, 0, 0.94);
        color: white;
        font-family: Arial, sans-serif;
    `;


    deathScreen
        .querySelector(".deathBox")
        .style.cssText = `
            padding: 45px;
            min-width: 320px;
            background: #15151d;
            border: 2px solid #ff2222;
            border-radius: 20px;
            box-shadow:
                0 0 35px rgba(255, 0, 0, 0.4),
                inset 0 0 30px rgba(255, 0, 0, 0.05);
        `;


    deathScreen
        .querySelector("h1")
        .style.cssText = `
            color: #ff3333;
            font-size: 44px;
            margin-bottom: 15px;
        `;


    deathScreen
        .querySelector("p")
        .style.cssText = `
            color: #bbb;
            font-size: 18px;
            margin-bottom: 25px;
        `;


    deathScreen
        .querySelector("button")
        .style.cssText = `
            padding: 14px 30px;
            border: none;
            border-radius: 10px;
            background: #ff3333;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
        `;


    document.body.appendChild(deathScreen);
}


// ============================================
// START GHOST SYSTEM
// ============================================

function startGameSystems() {

    console.log("=================================");
    console.log("HAUNTED TREASURE HUNT STARTED");
    console.log("Treasures:", treasures.length);
    console.log("Ghost 1:", ghost1 ? "FOUND" : "MISSING");
    console.log("Ghost 2:", ghost2 ? "FOUND" : "MISSING");
    console.log("Player:", player ? "FOUND" : "MISSING");
    console.log("=================================");

    requestAnimationFrame(moveGhosts);
}


// Wait until A-Frame has loaded
if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        startGameSystems
    );

} else {

    startGameSystems();
}