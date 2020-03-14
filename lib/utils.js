module.exports = {
  formatNumber(number) {
    return number.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },

  shortHash(hash) {
    return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
  },

  wait(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  },
};
