module.exports =  class UpdateModel {
  constructor(data) {
    this.title = data.title || null;
    this.image = data.image || null;
    this.message = data.message || null;
  }
}