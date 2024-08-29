import kaboom from "kaboom";

export const k = kaboom({
    global: false, //translate
    touchToMouse: true,
    canvas: document.getElementById("game"),
})