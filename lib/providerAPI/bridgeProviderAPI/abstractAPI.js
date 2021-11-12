class AbstractAPI {      
  constructor (impl) {
    this.impl = impl;
  }  
  
  get api() {
    return this.impl._api;
  }

  getCollection(id) {
    throw new Error("This is method is abastrac");
  }
}

module.exports = { AbstractAPI };