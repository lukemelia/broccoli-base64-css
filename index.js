var fs = require('fs');
var path = require('path');
var Filter = require('broccoli-filter');

Base64CSS.prototype = Object.create(Filter.prototype);
Base64CSS.prototype.constructor = Base64CSS;
function Base64CSS (inputTree, options) {
  if (!(this instanceof Base64CSS)) return new Base64CSS(inputTree, options);

  options = options || {};
  options.imagePath || (options.imagePath = 'public');

  this.inputTree = inputTree;
  this.imagePath = path.join(process.cwd(), options.imagePath);
  this.extensions = options.extensions || ['css'];
  this.maxFileSize = options.maxFileSize || 4096;
  this.fileTypes = options.fileTypes || ['png', 'jpg', 'jpeg', 'gif', 'svg'];
  this.fileTypesRegex = new RegExp('url\\(["\']?(\\S*)\\.('+this.fileTypes.join('|')+')["\']?\\)', 'g');
}
module.exports = Base64CSS;

Base64CSS.prototype.processString = function(string) {
  var imagePath = this.imagePath;
  var maxFileSize = this.maxFileSize;

  return string.replace(this.fileTypesRegex, function(match, file, type) {
    var fileName = file + '.' + type;
    var filePath = path.join(imagePath, fileName);
    var size = fs.statSync(filePath).size;

    if (size > maxFileSize) return match;
    if (type === 'jpg') type = 'jpeg';
    if (type === 'svg') type = 'svg+xml';

    var base64 = fs.readFileSync(filePath).toString('base64');
    return 'url("data:image/' + type + ';base64,' + base64 + '")';
  });
};

