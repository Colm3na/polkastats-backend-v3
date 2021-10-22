const chalk = require('chalk')

let instance = null;
let log = console.log

class Logger {
  constructor() {
    if(!instance) {
      instance = this;
    }
    return instance;
  }
  
  default(msg) {
    log(msg)
  }

  info(msg) {
    log(chalk.blue(`${msg}`))
  }  

  green(msg) {
    log(chalk.green(`${msg}`))
  }
  
  error({message, name, stack}) {
    log(chalk.bgRed(`${name}`));
    log(chalk.red(`Message: ${message}`))
    log(chalk.red(`Stack: ${stack}`))
  }
}

module.exports = { Logger }