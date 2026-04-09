module.exports = {
  mergeCustomizer: function (objValue, srcValue) {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  },
};
