const { initBTCCurve } = require("./src");

const originalTest = global.test;
const NUM_ITERATIONS = 3;
;

initBTCCurve();

global.test = (name, fn, timeout) => {
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    originalTest(`${name} (iteration ${i + 1})`, fn, timeout);
  }
};

const originalIt = global.it;

global.it = (name, fn, timeout) => {
  for (let i = 0; i < NUM_ITERATIONS; i++) {
    originalIt(`${name} (iteration ${i + 1})`, fn, timeout);
  }
};

global.it.each = originalIt.each;
