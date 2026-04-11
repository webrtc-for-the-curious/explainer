let timer;

// SDP = Session Description Protocol, Defined in RFC 8866

function parseSDP() {
    let sdp = document.getElementById("sdp-input").value;
    console.log("parsing SDP");
    let lines = sdp.split(/\r?\n/);
    for (const line of lines) {
        console.log(line)
    }
}

function onSDPInput() {
    // clear previous timer
    clearTimeout(timer);

    // start new timer
    timer = setTimeout(() => { parseSDP(); }, 700);
}