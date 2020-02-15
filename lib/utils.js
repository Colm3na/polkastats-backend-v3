module.exports = {
  formatNumber: function (number) {
    return (number.toString()).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
  },
  shortHash: function (hash) {
    return `${hash.substr(0, 4)}...${hash.substr(hash.length - 4, 4)}`;
  }
};