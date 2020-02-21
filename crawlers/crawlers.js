const harvester = require("./block-harvester");
const listener = require("./block-listener");

const runCrawlers = () => {
  harvester.run();
  listener.run();
};

exports.runCrawlers = runCrawlers;
