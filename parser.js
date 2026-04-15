// SDP stands for Session Description Protocol, and is defined in RFC 8866.
// RFC 8829, which established the JavaScript Session Establishment Protocol,
// discussed the SDP keys relevant to WebRTC. RFC 9429 obsoleted RFC 8829.

const NewLineRegex = /\r?\n/;
const DescriptionLineRegex = /([^=]*)=(.*)/;

class Description {
    constructor(lines) {
        this.lines = structuredClone(lines);
    }

    firstLineNumber() {
        return this.lines[0][0];
    }

    lastLineNumber() {
        return this.lines.at(-1)[0];
    }

    toString() {
        return this.lines.map((line) => `${line[1]}=${line[2]}`).join("\n");
    }

    explain() {
        const key = this.lines.at(0)[1];
        const info = {
            heading: (() => {
                switch (key) {
                    case 'm': return "Media Description";
                    case 'v': return "Session Description";
                    default: return "Unknown Section";
                }
            })()
        };
        return JSON.stringify(info);
    }
};

export function parseSDP(sdp) {
    if (sdp.length == 0) {
        return;
    }

    let sections = [];
    for (const [index, line] of sdp.split(NewLineRegex).entries()) {
        if (line.length == 0) {
            console.debug(`line ${index} empty`);
            continue;
        }

        try {
            let [, key, value] = line.match(DescriptionLineRegex);
            if (key == "v") {
                if (sections.length == 0) {
                    sections.push([ [index, key, value] ]);
                } else {
                    // Only one 'v' line is allowed in a SDP
                }
            } else if (key == "m") {
                sections.push([ [index, key, value] ]);
            } else {
                sections.at(-1).push([index, key, value]);
            }
        } catch (error) {
            console.log(`error parsing line ${index}`)
        }
    }

    let descriptions = [];
    for (const s of (sections || [])) {
        let d = new Description(s);
        descriptions[d.firstLineNumber()] = d;
    }

    console.log(`Done parsing SDP, found ${sections.length} sections`);

    return descriptions;
}

export function mapLineToDescription(descriptions, line) {
    let prevDescription;
    for (const [key, description] of Object.entries(descriptions)) {
        if (line == key) {
            return description;
        } else if (line < key) {
            return prevDescription;
        }
        prevDescription = description;
    }
    return prevDescription;
}
