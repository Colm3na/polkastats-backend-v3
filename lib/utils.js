module.exports = {
  formatNumber: function (number) {
    return (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },
  shortHash: function (hash) {
    return `${hash.substr(0, 6)}…${hash.substr(hash.length - 5, 4)}`;
  },
  wait: async function (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
};