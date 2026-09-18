"use strict";

function unsupported() {
  throw new Error("sharp is stubbed in this deploy (text embeddings only).");
}

function sharp() {
  return new Proxy(
    {},
    {
      get() {
        return unsupported;
      },
    },
  );
}

module.exports = sharp;
module.exports.default = sharp;
module.exports.sharp = sharp;
