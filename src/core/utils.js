const chalk = require('chalk');

const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const formatSymbol = (symbol) => {
    let formated = symbol.replace(/\/.*/, '');
    formated = chalk.magenta(formated);
    return formated;
}
const formatPrice = (price) => {
    const formated = price.toFixed(2) + '💲';
    return formated;
}
const formatSide = (side) => {
    let formated = '';
    if (side.toLowerCase() === 'short' || side.toLowerCase() === 'sell'){
        formated = chalk.red('[📉 ' + side.toUpperCase() + ']');
    } else {
        formated = chalk.green('[📈 ' + side.toUpperCase() + ']');
    }
    return formated;
}

module.exports = { 
    catchAsync,
    formatSymbol,
    formatPrice,
    formatSide
};