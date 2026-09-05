const fs = require('fs');
const path = require('path');

/**
 * Decode a string number of any base (up to base 36) into a BigInt.
 */
function parseBigInt(str, base) {
  const b = BigInt(base);
  let res = 0n;
  for (let char of str.toLowerCase()) {
    let digit = BigInt(parseInt(char, 36));
    res = res * b + digit;
  }
  return res;
}

/**
 * Parse input JS/JSON object into points (x, y) as BigInts.
 */
function parseData(data) {
  const k = data.keys.k;
  const n = data.keys.n;
  const points = [];

  for (let key in data) {
    if (key === 'keys') continue;
    const x = BigInt(key);
    const y = parseBigInt(data[key].value, parseInt(data[key].base));
    points.push({ x, y });
  }

  points.sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0));
  return { k, n, points };
}

/**
 * Load test case from JS module or JSON file path.
 */
function loadTestCase(target) {
  if (typeof target === 'object') return target;
  const resolved = path.resolve(target);
  if (fs.existsSync(resolved)) {
    if (resolved.endsWith('.js')) {
      return require(resolved);
    } else if (resolved.endsWith('.json')) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }
  try {
    return require(target);
  } catch (e) {
    throw new Error('Could not load test case target: ' + target);
  }
}

/**
 * Perform Lagrange Interpolation at x = 0 to find constant term c.
 */
function lagrangeInterpolationAtZero(pts) {
  const k = pts.length;
  let totalC = 0n;
  for (let i = 0; i < k; i++) {
    let num = pts[i].y;
    let den = 1n;

    for (let j = 0; j < k; j++) {
      if (i !== j) {
        num *= (-pts[j].x);
        den *= (pts[i].x - pts[j].x);
      }
    }

    totalC += num / den;
  }

  return totalC;
}

/**
 * Solve for all coefficients [a_m, ..., a_0] of polynomial fitting subset using BigInt fractions.
 */
function getPolynomialCoefficients(sub) {
  const k = sub.length;

  function makeFrac(n, d = 1n) {
    if (d < 0n) { n = -n; d = -d; }
    return { num: n, den: d };
  }
  function simplify(f) {
    function gcd(a, b) {
      a = a < 0n ? -a : a;
      b = b < 0n ? -b : b;
      while (b > 0n) { let t = b; b = a % b; a = t; }
      return a;
    }
    const g = gcd(f.num, f.den);
    return { num: f.num / g, den: f.den / g };
  }
  function add(a, b) {
    return simplify({ num: a.num * b.den + b.num * a.den, den: a.den * b.den });
  }
  function subFrac(a, b) {
    return simplify({ num: a.num * b.den - b.num * a.den, den: a.den * b.den });
  }
  function mul(a, b) {
    return simplify({ num: a.num * b.num, den: a.den * b.den });
  }
  function div(a, b) {
    return simplify({ num: a.num * b.den, den: a.den * b.num });
  }

  const M = [];
  for (let i = 0; i < k; i++) {
    const row = [];
    let p = 1n;
    const x = sub[i].x;
    const powers = [];
    for (let j = 0; j < k; j++) {
      powers.push(p);
      p *= x;
    }
    powers.reverse();
    for (let j = 0; j < k; j++) {
      row.push(makeFrac(powers[j]));
    }
    row.push(makeFrac(sub[i].y));
    M.push(row);
  }

  for (let i = 0; i < k; i++) {
    let pivot = i;
    while (pivot < k && M[pivot][i].num === 0n) pivot++;
    if (pivot === k) return null;
    if (pivot !== i) {
      let tmp = M[i]; M[i] = M[pivot]; M[pivot] = tmp;
    }

    let pVal = M[i][i];
    for (let j = i; j <= k; j++) {
      M[i][j] = div(M[i][j], pVal);
    }

    for (let r = 0; r < k; r++) {
      if (r !== i) {
        let factor = M[r][i];
        for (let j = i; j <= k; j++) {
          M[r][j] = subFrac(M[r][j], mul(factor, M[i][j]));
        }
      }
    }
  }

  const coeffs = [];
  let allInteger = true;
  for (let i = 0; i < k; i++) {
    const c = M[i][k];
    if (c.den !== 1n) allInteger = false;
    coeffs.push(c);
  }
  return { coeffs, allInteger };
}

/**
 * Helper to get all combinations of k elements out of array.
 */
function getCombinations(arr, k, start = 0, current = [], results = []) {
  if (current.length === k) {
    results.push([...current]);
    return results;
  }
  for (let i = start; i < arr.length; i++) {
    current.push(arr[i]);
    getCombinations(arr, k, i + 1, current, results);
    current.pop();
  }
  return results;
}

/**
 * Main execution function for a test case target.
 */
function processTestCase(target, name) {
  console.log('====================================================');
  console.log(' Processing Test Case: ' + name);
  console.log('====================================================');

  const rawData = loadTestCase(target);
  const { k, n, points } = parseData(rawData);
  console.log('n = ' + n + ', k = ' + k);
  console.log('\nDecoded (x, y) Points:');
  points.forEach(p => console.log('  x = ' + p.x.toString().padStart(2) + ', y = ' + p.y.toString()));

  // 1. Direct First-k Points Method
  const firstKPoints = points.slice(0, k);
  const secretFirstK = lagrangeInterpolationAtZero(firstKPoints);
  console.log('\n----------------------------------------------------');
  console.log(' Method 1 (Standard Lagrange Interpolation on first k roots):');
  console.log(' Roots Used: [' + firstKPoints.map(p => p.x.toString()).join(', ') + ']');
  console.log(' Secret Constant Term (c) = ' + secretFirstK.toString());
  console.log('----------------------------------------------------');

  // 2. Integer Polynomial Error-Corrected Method
  const allSubsets = getCombinations(points, k);
  let validSubset = null;

  for (let sub of allSubsets) {
    const res = getPolynomialCoefficients(sub);
    if (res && res.allInteger && res.coeffs[res.coeffs.length - 1].num > 0n) {
      validSubset = { sub, coeffs: res.coeffs };
      break;
    }
  }

  if (validSubset) {
    const validKeys = validSubset.sub.map(p => p.x.toString());
    const corruptedKeys = points.map(p => p.x.toString()).filter(x => !validKeys.includes(x));
    const secretC = validSubset.coeffs[validSubset.coeffs.length - 1].num;

    console.log('\n----------------------------------------------------');
    console.log(' Method 2 (Clean Integer Polynomial / Imposter Point Filtering):');
    console.log(' Valid Roots (k = ' + k + '): [' + validKeys.join(', ') + ']');
    console.log(' Corrupted / Imposter Roots: [' + (corruptedKeys.length ? corruptedKeys.join(', ') : 'None') + ']');
    console.log(' Secret Constant Term (c) = ' + secretC.toString());
    console.log('----------------------------------------------------');
  }
  console.log('\n');
}

// Execute for provided arguments or default JS modules
const fileArgs = process.argv.slice(2);

if (fileArgs.length > 0) {
  fileArgs.forEach(arg => processTestCase(arg, arg));
} else {
  // Load native JS modules input1.js and input2.js
  const input1 = require('./input1.js');
  const input2 = require('./input2.js');
  processTestCase(input1, 'input1.js');
  processTestCase(input2, 'input2.js');
}
