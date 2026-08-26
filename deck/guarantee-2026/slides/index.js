'use strict';
// 번들러가 해석할 수 있도록 정적 맵으로 둔다 (동적 require 금지).
module.exports = {
  g01: require('./g01'),
  g02: require('./g02'),
  g03: require('./g03'),
};
