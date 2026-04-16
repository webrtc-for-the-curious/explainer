import { parseSDP, mapLineToDescription } from './parser.js';

let lineHeight;
let paddingLeft;
let paddingTop;
let sdpInputTimer;
let displayedLine;
let sdpDescriptions = {};
let sdpOverlays = {};

const explanationTemplate = {
    "<>": "h3",
    "text": "${heading}"
};

class SectionOverlay {
    constructor(parent, first, last) {
        this.overlay = document.createElement("div");

        let left = paddingLeft;
        let top = first * lineHeight + paddingTop;
        let width = parent.clientWidth - paddingLeft;
        let height = (last + 1) * lineHeight - top + paddingTop;
        console.log(`lines [${first}, ${last}], top ${top}, left ${left}, width ${width}, height ${height}`)

        this.overlay.style.position = "absolute"; 
        this.overlay.style.left = `${left}px`;
        this.overlay.style.width = `${width}px`;
        this.overlay.style.top = `${top}px`;
        this.overlay.style.height = `${height}px`;

        this.overlay.id = `overlay-section-${first}`
        parent.appendChild(this.overlay);
    }

    highlight() {
        this.overlay.style.backgroundColor = '#2af';
        this.overlay.style.opacity = '0.2';
    }

    clear() {
        this.overlay.style.backgroundColor = 'transparent';
        this.overlay.style.opacity = '0.0';
    }
};

function onSDPInput() {
    const handleInput = () => {
        // clear current children of overlay
        for (const [,sectionOverlay] of Object.entries(sdpOverlays)) {
            sectionOverlay.clear();
        }
        let overlay = document.getElementById("overlay");
        overlay.replaceChildren()

        // Parse new SDP and populate sdpOverlays
        try {
            let sdpinput = document.getElementById("sdp-input");

            // trim white space from both ends
            let lines = sdpinput.value.split("\n");

            // Setting the minHeight expands the textarea to show all the lines without a scrollbar.
            sdpinput.style.minHeight = `${lines.length + (sdpinput.offsetHeight - sdpinput.clientHeight)/lineHeight}lh`;

            let trimmed = lines.map((element, index, array) => { return element.trim(); });
            sdpinput.value = trimmed.join("\n");

            sdpOverlays = {};
            sdpDescriptions = parseSDP(sdpinput.value);
            displayedLine = null;

            for (const [index, [key, description]] of Object.entries(sdpDescriptions || []).entries()) {
                sdpOverlays[key] = new SectionOverlay(overlay, description.firstLineNumber(), description.lastLineNumber());
            }
        } catch (error) {
            console.error(`error ${error}`);
            overlay.replaceChildren();
            sdpDescriptions = {};
            sdpOverlays = {};
        }
    }

    let sdpinput = document.getElementById("sdp-input");
    if (sdpinput.value.length == 0) {
        handleInput();
    } else {
        // clear previous timer
        clearTimeout(sdpInputTimer);
        // start new timer
        sdpInputTimer = setTimeout(handleInput, 300);
    }
}

function onSDPLineClick(e) {
    let sdpInput = document.getElementById("sdp-input");
    if (sdpInput.value.length == 0) {
        return;
    }

    const rect = sdpInput.getBoundingClientRect();
    let linepos = Math.floor((e.clientY - rect.top - paddingTop) / lineHeight);
    console.log(`Y = ${e.clientY}, top = ${rect.top}, line = ${linepos}, height = ${lineHeight}`);
    if (displayedLine != null) {
        sdpOverlays[displayedLine].clear();
    }

    let description = mapLineToDescription(sdpDescriptions, linepos);
    if (description != null) {
        displayedLine = description.firstLineNumber();
        sdpOverlays[displayedLine].highlight();
    }

    let explanation = document.getElementById("explanation");
    explanation.innerHTML = ""
    explanation.json2html(description.explain(), explanationTemplate);
}

window.addEventListener('load', () => {
    // This function calculates the height of each line
    // in the textarea in a browser-independent way.
    let element = document.getElementById("sdp-input");
    let styles = window.getComputedStyle(element);

    paddingLeft = parseInt(styles.paddingLeft);
    paddingTop = parseInt(styles.paddingTop);

    const clone = element.cloneNode(false);
    clone.innerHTML = "A\nB"; // Format for two lines to get impact of line spacing
    clone.style.padding = "0";
    clone.style.border = "0";
    clone.style.visibility = "hidden";
    clone.style.position = "absolute";
    clone.style.minHeight = "2lh"

    document.body.appendChild(clone);
    lineHeight = clone.offsetHeight/2; // This is the line height in pixels
    document.body.removeChild(clone);

    console.debug(`lineHeight=${lineHeight}, paddingLeft=${paddingLeft}, paddingTop=${paddingTop}`);
});

window.onSDPInput = onSDPInput;
window.onSDPLineClick = onSDPLineClick;
