const {xhy, arg, addXhy, setCnchar} = require('./xhy');


function main (cnchar) {
    if (cnchar.plugins.indexOf('xhy') !== -1) {
        return;
    }
    setCnchar(cnchar);
    cnchar.plugins.push('xhy');
    cnchar.xhy = xhy;
    cnchar.type.xhy = arg;
}

function init (cnchar) {
    if (typeof window === 'object' && !window.CncharXHY) {
        window.CncharXHY = xhy;
    }
    if (typeof window === 'object' && window.CnChar) {
        main(window.CnChar);
    } else if (typeof cnchar !== 'undefined') {
        main(cnchar);
    }
}

xhy.init = init;

xhy.addXhy = addXhy;

init();

module.exports = xhy;