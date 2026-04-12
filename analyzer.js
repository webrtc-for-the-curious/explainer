let timer;

// SDP = Session Description Protocol, Defined in RFC 8866

const NewLineRegex = /\r?\n/;
const DescriptionLineRegex = /([^=]*)=(.*)/;
const PrimaryKeys = "vostm";
const SecondaryKeys = {
    null: "",
    "m": "ac",
    "t": "ar",
}

function parseSDP() {
    let sdp = document.getElementById("sdp-input").value;
    console.log("parsing SDP");

    let sections = [];
    let currSectionKey = null;
    for (const [index, line] of sdp.split(NewLineRegex).entries()) {
        if (line.length == 0) {
            console.log("line ${index} empty");
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
            console.log("discarding line ${index}, ${line}");
        }
    }

    for (const s of sections) {
        console.log(s)
    }
}

function onSDPInput() {
    // clear previous timer
    clearTimeout(timer);

    // start new timer
    timer = setTimeout(() => { parseSDP(); }, 700);
}