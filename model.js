// SDP stands for Session Description Protocol, and is defined in RFC 8866.
// RFC 8829, which established the JavaScript Session Establishment Protocol,
// discussed the SDP keys relevant to WebRTC. RFC 9429 obsoleted RFC 8829.

const NewLineRegex = /\r?\n/;
const DescriptionLineRegex = /([^=]*)=(.*)/;

let lineHeight;
let sdpInputTimer;
let sdpDescriptions = {};
let displayedLine;

class Description {
    constructor(lines) {
        this.lines = structuredClone(lines);
    }

    firstLine() {
        return this.lines[0][0];
    }

    toString() {
        return this.lines.map((line) => `${line[0]}: ${line[1]}=${line[2]}`).join("\n");
    }
};

function parseSDP() {
    let sdp = document.getElementById("sdp-input").value;

    if (sdp.length == 0) {
        return;
    }

    let sections = [];
    let currSectionKey = null;
    for (const [index, line] of sdp.split(NewLineRegex).entries()) {
        if (line.length == 0) {
            console.debug(`line ${index} empty`);
            continue;
        }

        let [, key, value] = line.match(DescriptionLineRegex);
        if (key == "m" || sections.length == 0) {
            sections.push([ [index, key, value] ]);
        } else {
            sections.at(-1).push([index, key, value]);
        }
    }

    sdpDescriptions = [];
    for (const s of sections) {
        let d = new Description(s);
        sdpDescriptions[d.firstLine()] = d;
    }

    console.debug("Done parsing SDP");
}

function mapLineToDescription(line) {
    let prevDescription;
    for (const [key, description] of Object.entries(sdpDescriptions)) {
        if (line == key) {
            return description;
        } else if (line < key) {
            return prevDescription;
        }
        prevDescription = description;
    }
    return prevDescription;
}

function onSDPInput() {
    // clear previous timer
    clearTimeout(sdpInputTimer);
    // start new timer
    sdpInputTimer = setTimeout(() => { parseSDP(); }, 700);
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
        let description = mapLineToDescription(linepos);
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
