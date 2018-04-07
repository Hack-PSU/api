module.exports =  class UpdateModel {
  constructor(data) {
    this.title = data.title || null;
    this.message = data.message || null;
  }
}