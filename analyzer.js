// SDP stands for Session Description Protocol, and is defined in RFC 8866.
// RFC 8829, which established the JavaScript Session Establishment Protocol,
// discussed the SDP keys relevant to WebRTC. RFC 9429 obsoleted RFC 8829.

const NewLineRegex = /\r?\n/;
const DescriptionLineRegex = /([^=]*)=(.*)/;
const PrimaryKeys = "vostm";
const SecondaryKeys = {
    null: "",
    "m": "acibk",
    "t": "ar",
};

let sdpInputTimer;
let sdpDescriptions = {};
let displayedLine;

class Description {
    constructor(lines) {
        this.lines = structuredClone(lines)
    }

    firstLine() {
        return this.lines[0][0]
    }

    toString() {
        return this.lines
    }
};

function parseSDP() {
    let sdp = document.getElementById("sdp-input").value;
    console.log("parsing SDP");

    let sections = [];
    let currSectionKey = null;
    for (const [index, line] of sdp.split(NewLineRegex).entries()) {
        if (line.length == 0) {
            console.log(`line ${index} empty`);
            continue;
        }

        let [, key, value] = line.match(DescriptionLineRegex);
        if (PrimaryKeys.includes(key)) {
            // Create new section and save the section key
            sections.push([ [index, key, value] ]);
            currSectionKey = key;
        } else if (SecondaryKeys[currSectionKey]?.includes(key)) {
            // Append to the last section
            sections.at(-1).push([index, key, value]);
        } else {
            // An unexpected key was found. Do we need to update
            // the primary or secondary keys?
            console.log(`discarding line ${index}, ${line}`);
        }
    }

    sdpDescriptions = [];
    for (const s of sections) {
        let d = new Description(s);
        sdpDescriptions[d.firstLine()] = d;
    }
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
    const rect = sdpInput.getBoundingClientRect();

    // The line-height must be set in css.
    let style = window.getComputedStyle(sdpInput);
    const lineHeight = parseInt(style.lineHeight, 10);

    let linepos = Math.floor((e.clientY - rect.top) / lineHeight);
    if (displayedLine != linepos) {
        displayedLine = linepos;
        let description = mapLineToDescription(linepos);
        console.dir(description);
    }
}