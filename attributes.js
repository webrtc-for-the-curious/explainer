/*
    'candidate':         {},
    'end-of-candidates': {},
    'fmtp':              {},
    'msid':              {},
    'rtcp-mux':          {},
    'rtcp-rsize':        {},
    'rtpmap':            {},
    'sendrecv':          {},
    'ssrc':              {},
*/

const attrParserMap = Object.freeze({
    'fingerprint':       parseFingerprint,
    'group':             parseGroup,
    'ice-pwd':           parseIcePassword,
    'ice-ufrag':         parseIceUsername,
    'mid':               parseMid,
    'setup':             parseSetup,
});

function parseFingerprint(value, attributes) {
    const [, hashfunc, hashvalstr] = value.match(/([^ ]*) (.*)/);
    const hashval = hashvalstr.match(/[0-9a-fA-F]+/g);
    attributes['hash-algorithm'] = hashfunc;
    attributes['hash-digest'] = hashval.map(hex => parseInt(hex, 16));
}

function parseGroup(value, attributes) {
    const [, idliststr] = value.match(/BUNDLE (.*)/);
    attributes['bundle'] = idliststr.match(/[0-9]+/g);
}

function parseSetup(value, attributes) {
    attributes['setup-role'] = value;
}

function parseMid(value, attributes) {
    attributes['mid'] = value;
}

function parseIceUsername(value, attributes) {
    attributes['ice-ufrag'] = value;
}

function parseIcePassword(value, attributes) {
    attributes['ice-pass'] = value;
}

function parseAttribute(key, value, attributes) {
    const fn = attrParserMap[key];
    if (fn) {
        fn(value, attributes);
    } else {
        console.log(`unknown key ${key}`);
    }
}

export class Attributes extends Map {
    constructor(attrlines) {
        super();
        
        const AttributeLineRegex = /([^:]*):?(.*)?/;
        attrlines
            .filter(line => line[1] === "a")
            .map(line => {
                let [, attrkey, attrvalue] = line[2].match(AttributeLineRegex);
                parseAttribute(attrkey, attrvalue, this);
            })
    }
}
