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
  options.assetsFromTree || (options.assetsFromTree = false);

  this.inputTree = inputTree;
  this.imagePath = options.imagePath;
  this.fontPath = options.fontPath;
  this.extensions = options.extensions || ['css'];
  this.maxFileSize = options.maxFileSize || 4096;
  this.fileTypes = options.fileTypes || ['png', 'jpg', 'jpeg', 'gif', 'svg'];
  this.urlsRegex = /url\(["\']?(.+?)["\']?\)/g;
  this.assetsFromTree = options.assetsFromTree;
}
module.exports = Base64CSS;

Base64CSS.prototype.write = function (readTree, destDir) {
  var self = this
  return readTree(this.inputTree).then(function (srcDir) {
    if (self.assetsFromTree) {
      self.fullImagePath = path.join(srcDir, self.imagePath);
      self.fullFontPath = path.join(srcDir, self.fontPath);
    } else {
      self.fullImagePath = path.join(process.cwd(), self.imagePath);
      self.fullFontPath = path.join(process.cwd(), self.fontPath);
    }
    return Filter.prototype.write.call(self, readTree, destDir);
  });
}

Base64CSS.prototype.processString = function(string, relativePath) {
  var imagePath = this.fullImagePath;
  var fontPath = this.fullFontPath;
  var maxFileSize = this.maxFileSize;
  var fileTypes = this.fileTypes;

  return string.replace(this.urlsRegex, function(match, fileName) {
    if (/^data:/.test(fileName)) return match;
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


