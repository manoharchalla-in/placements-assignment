# 🔐 Shamir's Secret Sharing - Polynomial Constant Term Solver

![Node.js](https://img.shields.io/badge/Node.js-v14%2B-brightgreen?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)
![Algorithm](https://img.shields.io/badge/Algorithm-Lagrange--Interpolation-orange?style=flat-square)

An arbitrary-precision solver for reconstructing polynomial secret keys from base-encoded roots using **Shamir's Secret Sharing (SSS)** algorithm and **Lagrange Interpolation**.

---

## 📌 Executive Summary

This repository solves the **Catalog Placement Online Coding Challenge** by reconstructing an unknown polynomial f(x) of degree m = k - 1 from n roots provided in JSON format. The objective is to identify the **secret constant term c = f(0)**.

### 🎯 Key Results

| Test Case | Inputs (n, k) | Valid Roots Used (x) | Secret Constant Term (c = f(0)) | Output Status |
| :--- | :---: | :--- | :--- | :---: |
| **Test Case 1** | n = 4, k = 3 | [1, 2, 3] | **3** | ✅ Verified |
| **Test Case 2 (Main)** | n = 10, k = 7 | [1, 3, 4, 5, 6, 9, 10] | **79836264049851** | ✅ Verified (Imposter Filtered) |
| **Test Case 2 (Direct)** | n = 10, k = 7 | [1, 2, 3, 4, 5, 6, 7] | **-24096280061418698085** | ℹ️ Raw First-k Roots |

---

## 📖 Problem Statement & Mathematical Foundations

### 1. Root Decoding
Each root (x_i, y_i) is provided in JSON format where:
- Key is the integer coordinate x_i
- alue is a string representation of y_i in base b_i

Decoding formula to base 10:
y_i = sum_{j=0}^{L-1} (digit_j * b_i^(L-1-j))

Since y_i can exceed standard 64-bit integer limits, decoding is performed using **JavaScript BigInt** arbitrary-precision arithmetic.

### 2. Lagrange Interpolation at x = 0
Given k points (x_1, y_1), (x_2, y_2), ..., (x_k, y_k), the polynomial f(x) is defined using Lagrange basis polynomials.

Evaluating at x = 0 yields the secret constant c:
c = f(0) = sum_{i=1}^{k} y_i * prod_{j != i} (-x_j) / (x_i - x_j)

### 3. Outlier / Corrupted Root Detection
When n > k, up to n - k points may be intentionally corrupted (imposter points). 

To locate the true secret:
1. We analyze all combinations of size k out of n points.
2. We perform Gaussian Elimination / Matrix solution to determine polynomial coefficients [a_{k-1}, ..., a_1, a_0].
3. The unique valid subset is the one where **all polynomial coefficients a_i are positive integers**, filtering out imposter roots.

---

## 🔬 Detailed Test Case Analysis

### 🟢 Test Case 1 (Sample Test Case)
- **Parameters:** n = 4, k = 3 => Quadratic Polynomial f(x) = a x^2 + b x + c

#### Decoded Points:
- Key 1: Base 10, Value 4 => (1, 4)
- Key 2: Base 2, Value 111 => (2, 7)
- Key 3: Base 10, Value 12 => (3, 12)
- Key 6: Base 4, Value 213 => (6, 39)

#### Reconstructed Polynomial:
f(x) = x^2 + 3
- f(1) = 1 + 3 = 4 ✅
- f(2) = 4 + 3 = 7 ✅
- f(3) = 9 + 3 = 12 ✅
- f(6) = 36 + 3 = 39 ✅

**Secret Constant Term (c):** **3**

---

### 🔵 Test Case 2
- **Parameters:** n = 10, k = 7 => Degree-6 Polynomial

#### Decoded Points Table:

| Key (x) | Base | String Value | Decoded y (Base 10) | Status |
| :---: | :---: | :--- | :--- | :---: |
| **1** | 6 | 13444211440455345511 | 995085094601491 | ✅ Valid |
| **2** | 15 | ed7015a346d635 | 320923294898495900 | ❌ Corrupted |
| **3** | 15 | 6aeeb69631c227c | 196563650089608567 | ✅ Valid |
| **4** | 16 | e1b5e05623d881f | 1016509518118225951 | ✅ Valid |
| **5** | 8 | 316034514573652620673 | 3711974121218449851 | ✅ Valid |
| **6** | 3 | 2122212201122002221120200210011020220200 | 10788619898233492461 | ✅ Valid |
| **7** | 3 | 2012022112221100010021002110200120112121 | 8903131658836114174 | ❌ Corrupted |
| **8** | 6 | 20220554335330240002224253 | 58725075613853308713 | ❌ Corrupted |
| **9** | 12 | 45153788322a1255483 | 117852986202006511971 | ✅ Valid |
| **10** | 7 | 1101613130313526312514143 | 220003896831595324801 | ✅ Valid |

#### Reconstructed Integer Polynomial (Valid Subset [1, 3, 4, 5, 6, 9, 10]):
f(x) = 205802168748539 x^6 + 129715447661077 x^5 + 105860038268942 x^4 + 147160079768248 x^3 + 234176747398429 x^2 + 92534348706405 x + 79836264049851

**Secret Constant Term (c):** **79836264049851**

---

## 🛠️ Repository Structure

`
.
├── index.js          # Core solver logic (Base conversion, Lagrange, Gauss Elimination)
├── input1.json       # Sample test case JSON
├── input2.json       # Second test case JSON
├── package.json      # Node.js project manifest
└── README.md         # Detailed problem documentation & solution report
`

---

## 🚀 How to Run

### 1. Prerequisites
Ensure you have **Node.js (v14+)** installed.

### 2. Execution
To run the solver against all test cases:
`ash
npm start
`
Or run specifically:
`ash
node index.js input1.json input2.json
`

### 3. Sample Console Output
`	ext
====================================================
 Processing Test Case: input1.json
====================================================
n = 4, k = 3

Method 1 (Standard Lagrange Interpolation on first k roots):
  Secret Constant Term (c) = 3

Method 2 (Clean Integer Polynomial / Imposter Point Filtering):
  Valid Roots (k = 3): [1, 2, 3]
  Secret Constant Term (c) = 3

====================================================
 Processing Test Case: input2.json
====================================================
n = 10, k = 7

Method 1 (Standard Lagrange Interpolation on first k roots):
  Secret Constant Term (c) = -24096280061418698085

Method 2 (Clean Integer Polynomial / Imposter Point Filtering):
  Valid Roots (k = 7): [1, 3, 4, 5, 6, 9, 10]
  Corrupted / Imposter Roots: [2, 7, 8]
  Secret Constant Term (c) = 79836264049851
`

---
*Created for the Catalog Placements Online Coding Assessment.*
