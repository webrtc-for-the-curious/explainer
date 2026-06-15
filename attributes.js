import ipaddr from "https://cdn.jsdelivr.net/npm/ipaddr.js@2/+esm";

/*
    'fmtp':              {},
    'msid':              {},
    'rtpmap':            {},
    'sendrecv':          {},
    'ssrc':              {},
*/

const attrParserMap = Object.freeze({
    'candidate':         parseCandidate,
    'end-of-candidates': v => { },
    'fingerprint':       parseFingerprint,
    'group':             parseGroup,
    'ice-pwd':           parseIcePassword,
    'ice-ufrag':         parseIceUsername,
    'mid':               parseMid,
    'rtcp-mux':          parseRTCPOption,
    'rtcp-rsize':        parseRTCPOption,
    'setup':             parseSetup,
});

export const CONSTANT = {
    CandidateType: Object.freeze({
        Unknown:         'unknown',
        Host:            'host',
        ServerReflexive: 'srflx',
        PeerReflexive:   'prflx',
        Relayed:         'relay',
    }),
}

class Candidate {
    foundation  = null;
    componentId = null;
    transport   = null;
    priority    = null;
    type        = CONSTANT.CandidateType.Unknown;
    address     = null;
    port        = null;
    raddress    = null;
    rport       = null;
}

function parseIPAddressIfValid(addr) {
    if (addr === undefined || addr == null) {
        return null;
    }
    try {
        return ipaddr.parse(addr);
    } catch {
        console.error(`Unable to parse IP address ${addr}`);
        return null;
    }
}

function parseCandidate(_key, value, attributes) {
    // Candidate attribute is defined in sec 5.1 of rfc-8839.
    const ipaddress = `[0-9a-fA-F\\.\\:]`;
    const CandidateRegex = new RegExp(
        `(?<foundation>[a-zA-Z\\d\+\/]{1,32})`
        + ` (?<component_id>\\d{1,3})`
        + ` (?<transport>[^ ]+)`
        + ` (?<priority>\\d{1,10})`
        + ` (?<ipaddress>${ipaddress}+)`
        + ` (?<port>\\d+)`
        + ` typ (?<type>host|srflx|prflx|relay|[^ ]+)`
        + ` (?:raddr (?<reladdr>${ipaddress}+) rport (?<relport>\\d+))?`
    );

    const results = value.match(CandidateRegex)

    
    var c = new Candidate();
    c.foundation  = results.groups.foundation;
    c.componentId = results.groups.component_id;
    c.transport   = results.groups.transport;
    c.priority    = results.groups.priority;
    c.address     = parseIPAddressIfValid(results.groups.ipaddress);
    c.port        = results.groups.port;
    c.type        = results.groups.type;
    c.raddress    = parseIPAddressIfValid(results.groups.reladdr);
    c.rport       = results.groups.relport;

    attributes['candidates'] ??= []
    attributes['candidates'].push(c);
}

function parseRTCPOption(key, _value, attributes) {
    console.log(`parseRTCPOption: ${key}`);
    if (key == "rtcp-mux") {
        attributes['rtcp-mux'] = true;
    } else if (key == 'rtcp-rsize') {
        attributes['rtcp-rsize'] = true;
    }
}

function parseFingerprint(_key, value, attributes) {
    const [, hashfunc, hashvalstr] = value.match(/([^ ]*) (.*)/);
    const hashval = hashvalstr.match(/[0-9a-fA-F]+/g);
    attributes['hash-algorithm'] = hashfunc;
    attributes['hash-digest'] = hashval.map(hex => parseInt(hex, 16));
}

function parseGroup(_key, value, attributes) {
    const [, idliststr] = value.match(/BUNDLE (.*)/);
    attributes['bundle'] = idliststr.match(/[0-9]+/g);
}

function parseSetup(_key, value, attributes) {
    attributes['setup-role'] = value;
}

function parseMid(_key, value, attributes) {
    attributes['mid'] = value;
}

function parseIceUsername(_key, value, attributes) {
    attributes['ice-ufrag'] = value;
}

function parseIcePassword(_key, value, attributes) {
    attributes['ice-pass'] = value;
}

function parseAttribute(key, value, attributes) {
    const fn = attrParserMap[key];
    if (fn) {
        fn(key, value, attributes);
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
