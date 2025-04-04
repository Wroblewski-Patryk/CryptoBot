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
const formatStrategy = (strategy) => {
    let formated = '';
    formated = String(strategy).charAt(0).toUpperCase() + String(strategy).slice(1);
    return formated;
}
const formatSymbolForBinance = (symbol) => symbol.replace(':USDT', '').replace('/', '');

module.exports = { 
    catchAsync,
    formatSymbol,
    formatPrice,
    formatSide,
    formatSymbolForBinance,
    formatStrategy
};