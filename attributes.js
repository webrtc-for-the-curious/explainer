import ipaddr from "https://cdn.jsdelivr.net/npm/ipaddr.js@2/+esm";

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
    'candidate':         parseCandidate,
    'fingerprint':       parseFingerprint,
    'group':             parseGroup,
    'ice-pwd':           parseIcePassword,
    'ice-ufrag':         parseIceUsername,
    'mid':               parseMid,
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
    relAddress  = null;
    relPort     = null;
}

function parseIPAddressOrNull(addr) {
    if (addr === undefined || addr == null) {
        console.debug(`address is undefined or null`);
        return null;
    }
    try {
        return ipaddr.parse(addr);
    } catch {
        console.error(`Unable to parse IP address ${addr}`);
        return null;
    }
}

function parseCandidate(value, attributes) {
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
    c.address     = parseIPAddressOrNull(results.groups.ipaddress);
    c.port        = results.groups.port;
    c.type        = results.groups.type;
    c.relAddress  = parseIPAddressOrNull(results.groups.reladdr);
    c.relPort     = results.groups.relport;

    attributes['candidates'] ??= []
    attributes['candidates'].push(c);
}

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
