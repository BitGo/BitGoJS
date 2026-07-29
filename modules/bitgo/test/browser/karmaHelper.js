// intercept & mock all the redudant calls to fetch constants by the browser
(function (global) {
  const constants = {};
  BitGoJS.BitGo.prototype.getConstants = (params) => constants;
  BitGoJS.BitGo.prototype.fetchConstants = (params, callback) =>
    new Promise((resolve) => {
      resolve({
        ...constants,
      });
    });
})(window);
