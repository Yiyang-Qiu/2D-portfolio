import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCTX"
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 940,
        "walk-down": { from: 940, to: 943, loop: true, speed: 8 },
        "idle-side": 979,
        "walk-side": { from: 979, to: 982, loop: true, speed: 8 },
        "idle-up": 1018,
        "walk-up": { from: 1018, to: 1021, loop: true, speed: 8 },
    },
});

//loding map png file
k.loadSprite("map", "./map.png");
//set background color
k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
    //if didnt use await, the rest of code will continue to run fetch
    //load the map first until it's done 
    const mapData = await (await fetch("./map.json")).json();
    const layers = mapData.layers;

    //create game object
    const map = k.add([
        k.sprite("map"),
        k.pos(0),
        k.scale(scaleFactor)
    ]);

    const player = k.make([
        k.sprite("spritesheet", { anim: "idle-down" }),
        k.area({
            shape: new k.Rect(k.vec2(0, 3), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(505.4, 91.89),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    for (const layer of layers) {
        if (layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic: true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        displayDialogue(dialogueData[boundary.name],
                            () => player.isInDialogue = false);
                    });
                }
            }
            continue;
        }

        if (layer.name === "spawnpoint") {
            for (const enity of layer.objects) {
                if (enity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + enity.x) * scaleFactor,
                        (map.pos.y + enity.y) * scaleFactor,
                    );
                    k.add(player);
                    continue;
                }
            }
        }
    }

    setCamScale(k);

    k.onResize(() => {
        setCamScale(k);
    });

    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y + 100);
    });

    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);

        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        //up
        if (
            mouseAngle > lowerBound && mouseAngle < upperBound &&
            player.curAnim() !== "walk-up"
        ) {
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        //down
        if (
            mouseAngle < -lowerBound && mouseAngle > -upperBound &&
            player.curAnim() !== "walk-down"
        ) {
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        //right
        if (Math.abs(mouseAngle) > upperBound) {
            player.flipX = false;
            if (player.curAnim() !== "walk-side") {
                player.play("walk-side");
            }
            player.direction = "right";
            return;
        }

        //left
        if (Math.abs(mouseAngle) < lowerBound) {
            player.flipX = true;
            if (player.curAnim() !== "walk-side") {
                player.play("walk-side");
            }
            player.direction = "left";
            return;
        }


        k.onMouseRelease(() => {
            if (player.direction === "down") {
                player.play("idle-down");
                return;
            }
            if (player.direction === "up") {
                player.play("idle-up");
                return;
            }

            player.play("idle-side");
        });
    });




    k.onKeyDown((key) => {
        console.log("Key pressed:", key);
    });

    k.onKeyDown((key) => {
        const keyMap = [
            k.isKeyDown("right"),
            k.isKeyDown("left"),
            k.isKeyDown("up"),
            k.isKeyDown("down"),
        ];

        let nbOfKeyPressed = 0;
        for (const key of keyMap) {
            if (key) {
                nbOfKeyPressed++;
            }
        }

        if (nbOfKeyPressed > 1) return;

        if (player.isInDialogue) return;
        if (keyMap[0]) {
            player.flipX = false;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "right";
            player.move(player.speed, 0);
            return;
        }

        if (keyMap[1]) {
            player.flipX = true;
            if (player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";
            player.move(-player.speed, 0);
            return;
        }

        if (keyMap[2]) {
            if (player.curAnim() !== "walk-up") player.play("walk-up");
            player.direction = "up";
            player.move(0, -player.speed);
            return;
        }

        if (keyMap[3]) {
            if (player.curAnim() !== "walk-down") player.play("walk-down");
            player.direction = "down";
            player.move(0, player.speed);
        }
    });

    k.onKeyRelease(() => {
        if (player.direction === "down") {
            player.play("idle-down");
            return;
        }
        if (player.direction === "up") {
            player.play("idle-up");
            return;
        }

        player.play("idle-side");
    });
});

//by default, it goes to main scene
k.go("main");

