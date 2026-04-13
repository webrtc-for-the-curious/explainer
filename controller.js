import { parseSDP, mapLineToDescription } from './parser.js';

let lineHeight;
let elementOffset;
let sdpInputTimer;
let displayedLine;
let sdpDescriptions = {};
let sdpOverlays = {};

function onSDPInput() {
    const handleInput = () => {
        // clear current children of overlay
        for (const [,sectionOverlay] of Object.entries(sdpOverlays)) {
            sectionOverlay.style.backgroundColor = 'transparent';
            sectionOverlay.style.opacity = '0.0';
        }
        let overlay = document.getElementById("overlay");
        overlay.replaceChildren()

        // Parse new SDP and populate sdpOverlays
        try {
            let sdpinput = document.getElementById("sdp-input");
            sdpOverlays = {};
            sdpDescriptions = parseSDP(sdpinput.value);

            for (const [key, description] of Object.entries(sdpDescriptions || [])) {
                let sectionOverlay = document.createElement("div");
                sectionOverlay.style.left = "0";
                sectionOverlay.style.width = "100%";

                let top = (description.firstLineNumber()) * lineHeight;
                let height = (description.lastLineNumber() + 1) * lineHeight - top;
                sectionOverlay.style.top = `${top + elementOffset}px`;
                sectionOverlay.style.height = `${height + elementOffset}px`;

                sectionOverlay.id = `overlay-section-${description.firstLineNumber()}`
                overlay.appendChild(sectionOverlay);

                sdpOverlays[key] = sectionOverlay;
            }
        } catch (error) {
            console.log(`error ${error}`);
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
    let linepos = Math.floor((e.clientY - rect.top) / lineHeight);

    if (displayedLine != null) {
        sdpOverlays[displayedLine].style.backgroundColor = 'transparent';
        sdpOverlays[displayedLine].style.opacity = '0.0';
    }

    let description = mapLineToDescription(sdpDescriptions, linepos);
    if (description != null) {
        displayedLine = description.firstLineNumber();
        sdpOverlays[displayedLine].style.backgroundColor = '#2af';
        sdpOverlays[displayedLine].style.opacity = '0.2';
    }
    console.log(`Description = ${description}`);
}

window.addEventListener('load', () => {
    // This function calculates the height of each line
    // in the textarea in a browser-independent way.
    let element = document.getElementById("sdp-input");
    let styles = window.getComputedStyle(element);
    // Not sure where the additional 1px is coming from.
    // It seems to give good alignment for now.
    elementOffset = parseInt(styles.paddingTop) + parseInt(styles.borderTop) + 1;
    
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

    console.log(`lineHeight=${lineHeight}, elementOffset=${elementOffset}`);
});

window.onSDPInput = onSDPInput;
window.onSDPLineClick = onSDPLineClick;
