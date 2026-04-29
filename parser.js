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
        const info = {
            heading: "Unknown Section"
        };
        return JSON.stringify(info);
    }
};

class SessionDescription extends Description {
    constructor(lines) {
        super(lines);
        this.media = [];
    }

    addMedia(media) {
        if (!(media instanceof MediaDescription)) {
            throw new Error("Adding non-MediaDescription object");
        }
        this.media.push(media);
    }

    explain() {
        let mediaitems = []
        for (const [ , m] of Object.entries(this.media)) {
            console.log(m);
            console.log(Object.getOwnPropertyNames(m))
            mediaitems.push( { type: m.mediatype } );
        }

        const info = {
            heading: "Session Description",
            media: {
                subheading: `${this.media.length} media descriptions`,
                items: mediaitems,
            }
        };

        return JSON.stringify(info, null, 2);
    }

}

class MediaDescription extends Description {
    constructor(session, lines) {
        super(lines);
        this.session = session;

        // From section 5.14 of RFC 8866
        // m=<media> <port> <proto> <fmt> ...
        let mline = /(?<media>[^ ]*) (?<port>\d*)\/?(?<numports>\d*)? (?<proto>[^ ]*) (?<fmt>.*)/
        const results = this.lines[0][2].match(mline);

        this.mediatype = results.groups.media;
        this.port      = results.groups.port;
        this.numports  = results.groups.numports ?? 1;
        this.proto     = results.groups.proto;
        this.fmt       = results.groups.fmt;

        console.dir(this);
    }

    explain() {
        const info = {
            heading: "Media Description"
        };
        return JSON.stringify(info, null, 2);
    }
}

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

    let session = null;
    let descriptions = [];
    for (const s of (sections || [])) {
        switch (s[0][1]) {
            case 'v':
                if (session != null) {
                    throw new Error("Found multiple session descriptions");
                }
                session = new SessionDescription(s);
                descriptions[session.firstLineNumber()] = session;
                break;
            case 'm':
                let media = new MediaDescription(session, s);
                session.addMedia(media);
                descriptions[media.firstLineNumber()] = media;
                break
        }
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
