# Catalog Placements Assignment - Shamir's Secret Sharing Solver

This project implements a solution to reconstruct a polynomial of degree m = k - 1 from given (x, y) shares encoded in various number bases, and solves for the secret constant term c = f(0).

## Problem Overview
Given a set of n roots formatted as JSON where:
- Key is x
- alue is y encoded in string format of specified ase
- k = m + 1 is the minimum number of roots required to determine the polynomial of degree m.

The objective is to decode the y values into decimal integers, perform Lagrange Interpolation, and calculate c = f(0).

---

## Theoretical Background

### 1. Base Conversion
Each y value is decoded from base b to base 10 using arbitrary-precision arithmetic (BigInt).

### 2. Lagrange Interpolation
For k roots (x_1, y_1), (x_2, y_2), ..., (x_k, y_k), the constant term c = f(0) is computed directly as:
c = sum_{i=1}^{k} y_i * prod_{j != i} (-x_j) / (x_i - x_j)

### 3. Outlier / Corrupted Root Detection
When n > k, some given roots may be corrupted. We locate the unique combination of k roots that produces a polynomial with positive integer coefficients, filtering out imposter roots.

---

## Final Results & Outputs

### Test Case 1 (Sample Test Case)
- **n = 4, k = 3**
- **Decoded Points:** (1, 4), (2, 7), (3, 12), (6, 39)
- **Polynomial:** f(x) = x^2 + 3
- **Secret Constant Term (c):** **3**

### Test Case 2
- **n = 10, k = 7**
- **Method 1 (Direct First-7 Roots Lagrange Output):** **-24096280061418698085**
- **Method 2 (Clean Integer Polynomial Output - Imposter Filtered):**
  - **Valid Roots (k = 7):** [1, 3, 4, 5, 6, 9, 10]
  - **Corrupted / Imposter Roots:** [2, 7, 8]
  - **Secret Constant Term (c):** **79836264049851**

---

## How to Run

### Prerequisites
- Node.js (v14+ recommended)

### Execution
Run the solver for both test cases:
`ash
npm start
`
Or execute specific JSON files:
`ash
node index.js input1.json input2.json
`
