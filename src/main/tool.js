
const tones = 'āáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ*ńňǹ'; // * 表示n的一声
const noTones = 'aoeiuün';
let defDict = require('./spell-default.json');
function _throw (err) {
    throw new Error('CnChar Error:' + err);
}
function _wran (err) {
    console.warn('CnChar Warning:' + err);
}
let arg = {
    array: 'array',
    low: 'low',
    up: 'up',
    first: 'first',
    poly: 'poly',
    tone: 'tone',
};
let _cnchar = null;
function initCnchar (cnchar) {
    _cnchar = cnchar;
}

function isCnChar (word) {
    let unicode = word.charCodeAt(0);
    return unicode >= 19968 && unicode <= 40869;
}
function has (args, name) {
    return args.indexOf(name) !== -1;
}

function spell (dict, args) {
    let strs = args[0].split('');
    args = args.splice(1);
    checkArgs('spell', args);
    let poly = has(args, arg.poly);
    let tone = has(args, arg.tone);
    let res = [];
    for (let sp in dict) { // 遍历拼音
        let ds = dict[sp];
        let pos = ds[0];
        for (let i = 0; i < strs.length; i++) { // 遍历字符数组
            let ch = strs[i];
            if (isCnChar(ch)) { // 如果是汉字
                let index = ds.indexOf(ch);
                if (index !== -1) {
                    let ssp = getSpell(sp, ds, index, poly, tone, pos); // single spell
                    if (ssp.poly) { // 多音字模式 且 当前汉字是多音字
                        if (!res[i]) {
                            res[i] = [];
                        }
                        res[i].push(ssp.res);
                        let dsNew = ds;
                        let n = dsNew.match(new RegExp(ch, 'g')).length;
                        for (let k = 1; k < n; k++) {
                            dsNew = dsNew.substr(index + 2);
                            index = dsNew.indexOf(ch);
                            res[i].push(getSpell(sp, dsNew, index, poly, tone, pos).res);
                        }
                    } else {
                        if (ssp.isPolyWord) { // 是多音字 不是多音字模式
                            if (defDict[ch]) { // 设置了多音字的默认拼音
                                ssp.res = removeTone(defDict[ch], tone).spell; // 默认有音调
                            }
                        }
                        res[i] = ssp.res;
                        strs[i] = '';
                    }
                }
            } else if (ch !== '') { // 如果不是汉字
                res[i] = ':' + ch;
            }
        }
    }
    dealUpLowFirst(res, args);
    for (let i = 0; i < strs.length; i++) {
        let item = res[i];
        if (typeof item === 'undefined') {
            res[i] = strs[i]; // 查不到的汉字返回原字
        } else if (typeof item !== 'string') {
            res[i] = `(${res[i].join('|')})`;
        } else if (item[0] === ':') {
            res[i] = item.substr(1); // 非汉字返回原字符
        }
    }
    if (!has(args, arg.array)) {
        res = res.join('');
    }
    return res;
}

function dealUpLowFirst (res, args) {
    if (_cnchar._.poly) {
        dealResCase(res, low);
        // 当启用了 多音词时 需要强制默认小写
        // 因为会被覆盖
    }
    if (has(args, arg.first)) {
        dealResCase(res, first);
    }
    if (has(args, arg.up)) {
        dealResCase(res, up);
    } else if (!has(args, arg.low)) {
        dealResCase(res, upFirst);
    }
}

function dealResCase (res, func) {
    res.forEach((item, i) => {
        if (typeof item !== 'string') {
            item.forEach((s, j) => {item[j] = func(s);});
        } else {
            if (item[0] !== ':')
                res[i] = func(item);
        }
    });
}

function first (s) {
    return s[0];
}

function up (s) {
    return s.toUpperCase();
}
function upFirst (s) {
    return up(s[0]) + s.substr(1);
}
function low (s) {
    return s.toLowerCase();
}


function getSpell (spell, str, index, isPoly, isTone, pos) {
    let res = {res: spell, poly: false};
    let tone = parseInt(str[index + 1]);
    res.isPolyWord = (tone >= 5);
    if (!isPoly && !isTone) {
        return res;
    }
    if (res.isPolyWord) { // 是多音字
        tone -= 5; // 正确的音调
        if (isPoly) { // 既是多音字模式 又是 多音字
            res.poly = true;
        }
    }
    if (isTone) {
        res.res = setTone(spell, pos, tone);
    }
    return res;
}

// tone=false : 根据有音调的拼音获得无音调的拼音和音调
// tone=true : 返回原拼音
function removeTone (spell, tone) {
    if (tone) {
        return {spell};
    }
    for (let i = 0; i < spell.length; i++) {
        let index = tones.indexOf(spell[i]);
        if (index !== -1) { // 命中
            return {
                spell: spell.substr(0, i) + noTones[Math.floor(index / 4)] + spell.substr(i + 1),
                tone: (index % 4) + 1,
                index: i + 1
            };
        }
    }
    return {spell, tone: 0, index: -1};
}

function setTone (spell, index, tone) {
    if (tone === 0) { // 轻声
        return spell;
    }
    let p = spell[index];
    return spell.replace(p, tones[noTones.indexOf(p) * 4 + (tone - 1)]);
}

// 笔画数
function stroke (dict, args) {
    let strs = args[0].split('');
    args = args.splice(1);
    checkArgs('stroke', args);
    for (let i = 0; i < dict.length; i++) {
        for (let j = 0; j < strs.length; j++) {
            if (typeof strs[j] === 'string') {
                if (dict[i].indexOf(strs[j]) !== -1) {
                    strs[j] = i;
                }
            }
        }
    }
    strs.forEach(function (c, i) {
        if (typeof c === 'string') {
            strs[i] = 0;
        }
    });
    if (!has(args, arg.array)) {
        return sumStroke(strs);
    }
    return strs;
}
function sumStroke (strs) {
    let sum = 0;
    strs.forEach(function (c) {
        sum += c;
    });
    return sum;
}

// spell 所有参数 ["array", "low", "up", "first", "poly", "tone", "simple"]
//  simple 禁用繁体字

// stroke 所有参数 ["letter", "shape", "count", "name", "detail", "array", "order", "simple"]
//
let _hasCheck = false;
function checkArgs (type, args, jumpNext) {
    if (!_cnchar.check) {
        return;
    }
    if (_hasCheck) {
        _hasCheck = false;
        return;
    }
    if (jumpNext) { _hasCheck = true; }
    let useless = [];
    let t = _cnchar.type;
    for (let i = args.length - 1; i >= 0; i--) {
        let arg = args[i];
        if (!t[type][arg]) {
            useless.push(arg);
            args.splice(i, 1);
        }
    }
    let ignore = [];
    let redunt = [];
    let check = (name, arr) => {
        if (typeof name === 'object') {
            name.forEach((item) => {
                check(item, arr);
            });
            return;
        }
        arr = arr || ignore;
        if (has(args, name)) { arr.push(name); }
    };
    if (_cnchar.plugins.indexOf('trad') === -1 && has(args, 'simple')) {
        ignore.push('simple');
    }
    if (type === 'spell') {
        if (has(args, 'up') && has(args, 'low')) {
            ignore.push('low');
        }
        // t.spell.origin 表示启用了多音词
        // !has(args,'origin') 表示没有禁用多音词
        // 此时的 poly 就会被忽略
        // if(t.spell.origin && !has(args,'origin') && has(args,'poly')){
        //     ignore.push('poly');
        // }
    } else if (type === 'stroke') { // stroke
        if (has(args, 'order')) { // 笔画顺序模式
            check('array', redunt);
            // detail > shape > name > count > letter 默认值是 letter
            if (has(args, 'letter')) {
                check(['detail', 'shape', 'name', 'count']);
                check('letter', redunt);
            } else if (has(args, 'detail')) {
                check(['shape', 'name', 'count']);
            } else if (has(args, 'shape')) {
                check(['name', 'count']);
            } else if (has(args, 'name')) {
                check(['count']);
            }
        } else { // 笔画数模式
            check(['detail', 'shape', 'name', 'letter']);
            check('count', redunt);
        }
    } else if (type === 'orderToWord') {
        if (has(args, 'match')) {
            check(['match-order', 'contain', 'start']);
        } else if (has(args, 'match-order')) {
            check(['contain', 'start']);
        } else if (has(args, 'contain')) {
            check(['start']);
        }
    } else if (type === 'strokeToWord') {
    } else if (type === 'spellToWord') {
    }
    warnArgs(useless, '无效', type);
    warnArgs(ignore, '被忽略', type);
    warnArgs(redunt, '冗余', type);
}
function warnArgs (arr, txt, type) {
    if (arr.length > 0) {
        _wran(`以下参数${txt}:${JSON.stringify(arr)};  可选值：[${Object.keys(_cnchar.type[type])}]`);
    }
}
module.exports = {
    _throw, _wran, arg, isCnChar, has, spell, stroke, dealUpLowFirst, removeTone, sumStroke, checkArgs, initCnchar, tones
};