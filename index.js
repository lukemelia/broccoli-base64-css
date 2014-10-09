var fs = require('fs');
var path = require('path');
var Filter = require('broccoli-filter');

var MEDIATYPE_MAP = {
  ttf: 'x-font-truetype',
  otf: 'x-font-opentype',
  woff: 'font-woff',
  eot: 'vnd.ms-fontobject',
  jpg: 'jpeg',
  svg: 'svg+xml'
};

Base64CSS.prototype = Object.create(Filter.prototype);
Base64CSS.prototype.constructor = Base64CSS;
function Base64CSS (inputTree, options) {
  if (!(this instanceof Base64CSS)) return new Base64CSS(inputTree, options);

  options = options || {};
  options.imagePath || (options.imagePath = 'public');
  options.fontPath || (options.fontPath = 'public');

  this.inputTree = inputTree;
  this.imagePath = path.join(process.cwd(), options.imagePath);
  this.fontPath = path.join(process.cwd(), options.fontPath);
  this.extensions = options.extensions || ['css'];
  this.maxFileSize = options.maxFileSize || 4096;
  this.fileTypes = options.fileTypes || ['png', 'jpg', 'jpeg', 'gif', 'svg'];
  this.urlsRegex = /url\(["\']?(.+?)["\']?\)/g;
}
module.exports = Base64CSS;

Base64CSS.prototype.processString = function(string) {
  var imagePath = this.imagePath;
  var fontPath = this.fontPath;
  var maxFileSize = this.maxFileSize;
  var fileTypes = this.fileTypes;

  return string.replace(this.urlsRegex, function(match, fileName) {
    fileName = fileName.replace(/(\?)?(#)(.*)\b/g, '');
    var extension = path.extname(fileName).substr(1);
    var type = MEDIATYPE_MAP[extension] || extension;
    if (!~fileTypes.indexOf(extension)) return match;

    var prefix = 'image';
    var filePath;

    if (/ttf|otf|woff|eot/.test(extension)) {
      prefix = 'application';
      filePath = path.join(fontPath, fileName);
    } else if (/svg/.test(extension)) {
      filePath = path.join(fontPath, fileName);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(imagePath, fileName);
      }
    } else {
      filePath = path.join(imagePath, fileName);
    }

    if (!fs.existsSync(filePath)) return match;

    var size = fs.statSync(filePath).size;
    if (size > maxFileSize) return match;

    var base64 = fs.readFileSync(filePath).toString('base64');
    return 'url("data:' + prefix + '/' + type + ';base64,' + base64 + '")';
  });
};
