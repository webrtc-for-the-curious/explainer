import { parseSDP, mapLineToDescription } from './model.js';

let lineHeight;
let sdpInputTimer;
let displayedLine;
let sdpDescriptions = {};

function onSDPInput() {
    // clear previous timer
    clearTimeout(sdpInputTimer);
    // start new timer
    sdpInputTimer = setTimeout(() => { 
        try {
            sdpDescriptions = parseSDP();
        } catch (error) {
            sdpDescriptions = {}
        }
    }, 700);
}

function onSDPLineClick(e) {
    let sdpInput = document.getElementById("sdp-input");
    if (sdpInput.value.length == 0) {
        return;
    }

    const rect = sdpInput.getBoundingClientRect();
    let linepos = Math.floor((e.clientY - rect.top) / lineHeight);
    if (displayedLine != linepos) {
        displayedLine = linepos;
        let description = mapLineToDescription(sdpDescriptions, linepos);
        console.log(`Description = ${description}`);
    }
}

window.addEventListener('load', () => {
    // This function calculates the height of each line
    // in the textarea in a browser-independent way.
    let element = document.getElementById("sdp-input");
    const clone = element.cloneNode(false);
    clone.innerHTML = "A"; // Use a single character
    clone.style.padding = "0";
    clone.style.border = "0";
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";
    clone.style.minHeight = "1lh"
  
    document.body.appendChild(clone);
    lineHeight = clone.offsetHeight; // This is the line height in pixels
    document.body.removeChild(clone);
});

window.onSDPInput = onSDPInput;
window.onSDPLineClick = onSDPLineClick;
