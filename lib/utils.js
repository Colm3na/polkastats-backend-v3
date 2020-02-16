module.exports = {
  formatNumber: function (number) {
    return (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },
  shortHash: function (hash) {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length, -4)}`;
  }
};