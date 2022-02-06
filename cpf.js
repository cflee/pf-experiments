const BigNumber = require('bignumber.js');

function cpfContribution(params) {
  // TODO: validate params
  // TODO: ensure that decimal inputs are, well, turned into decimals at earliest opportunity
  params['wage'] = new BigNumber(params['wage']);

  let result;

  // TODO: consider refactor to move the date periods out of this method
  if (params['contribution_date'] >= new Date("1955-07-01")) {
    result = cpfContribution195507(params);
  }

  // assume that the returned BigNumber is already rounded to the 2 decimal places
  // so just take it as we need to format it back to string
  result['employee_contribution'] = formatDollarAmount(result['employee_contribution']);
  result['employer_contribution'] = formatDollarAmount(result['employer_contribution']);

  return result;
}

// In the original ordinance passed on 11 Dec 1953, it was 5% from both workers and employers, for workers earning
// <$500, to take effect from 1 May 1955.
// Ref: Central Provident Fund Ordinance, 1953. (Ordinance 34 of 1953).
// Gazette Notification No. 2937 in Gazette No. 151 dated 14 Dec 1953 (page 1493).
// Gazette Notification No. S 398 in Gazette Supplement No. 88 dated 14 Dec 1953 (page 1228).
// Passed by Meeting of the Legislative Council on 24 Nov 1953, Governor's assent on 11 Dec 1953.
function cpfContribution195505(params) {
  const wage = params['wage'];

  // The contribution is defined in terms of the employee contribution, and then the employer contributes the same amount.
  // While it is often said to be 5%, the actual contribution rates as defined in the Schedule to the Ordinance
  // did not consistently match that, so it's not feasible to simply do a 5% and round calculation.
  // Instead, build a table.
  const ratesTable = [
    // When the wages do not exceed $10 -- nil
    { minExclusive: '0', maxInclusive: '10', contribution: '0.00' },
    // When the wages exceed $10 but not $30 -- $1.50
    { minExclusive: '10', maxInclusive: '30', contribution: '1.50' },
    // note in particular this band is not $2.50 as you might expect
    // it's 5% rounded up to dollar or $0.50
    { minExclusive: '30', maxInclusive: '40', contribution: '2.00' },
    // beyond this point, it is roughly 5% round up to $0.50, plus $0.50
    { minExclusive: '40', maxInclusive: '50', contribution: '3.00' },
    { minExclusive: '50', maxInclusive: '60', contribution: '3.50' },
    { minExclusive: '60', maxInclusive: '70', contribution: '4.00' },
    { minExclusive: '70', maxInclusive: '80', contribution: '4.50' },
    { minExclusive: '80', maxInclusive: '90', contribution: '5.00' },
    { minExclusive: '90', maxInclusive: '100', contribution: '5.50' },
    // beyond this point, it corresponds to 5% round up to dollar
    { minExclusive: '100', maxInclusive: '120', contribution: '6.00' },
    { minExclusive: '120', maxInclusive: '140', contribution: '7.00' },
    { minExclusive: '140', maxInclusive: '160', contribution: '8.00' },
    { minExclusive: '160', maxInclusive: '180', contribution: '9.00' },
    { minExclusive: '180', maxInclusive: '200', contribution: '10.00' },
    { minExclusive: '200', maxInclusive: '220', contribution: '11.00' },
    { minExclusive: '220', maxInclusive: '240', contribution: '12.00' },
    { minExclusive: '240', maxInclusive: '260', contribution: '13.00' },
    { minExclusive: '260', maxInclusive: '280', contribution: '14.00' },
    { minExclusive: '280', maxInclusive: '300', contribution: '15.00' },
    { minExclusive: '300', maxInclusive: '320', contribution: '16.00' },
    { minExclusive: '320', maxInclusive: '340', contribution: '17.00' },
    { minExclusive: '340', maxInclusive: '360', contribution: '18.00' },
    { minExclusive: '360', maxInclusive: '380', contribution: '19.00' },
    { minExclusive: '380', maxInclusive: '400', contribution: '20.00' },
    { minExclusive: '400', maxInclusive: '420', contribution: '21.00' },
    { minExclusive: '420', maxInclusive: '440', contribution: '22.00' },
    { minExclusive: '440', maxInclusive: '460', contribution: '23.00' },
    { minExclusive: '460', maxInclusive: '480', contribution: '24.00' },
    { minExclusive: '480', maxInclusive: '500', contribution: '25.00' },
    // When the wages exceed $500 -- $25.00
    { minExclusive: '500', maxInclusive: '+Infinity', contribution: '25.00' },
  ]

  let contribution = new BigNumber(0);
  
  for (const rate of ratesTable) {
    if (wage.isGreaterThan(rate.minExclusive) && wage.isLessThanOrEqualTo(rate.maxInclusive)) {
      contribution = new BigNumber(rate.contribution);
      break;
    }
  }

  // While the contribution amount is the same, this first instance already had the concept of employee contribution to
  // be deducted from the employee's wages, and the employer contribution to be paid on top and not allowed to be
  // recovered from the employee's wages.
  return {
    'employee_contribution': contribution,
    'employer_contribution': contribution,
  };
}

// There was another amendment in between that I haven't examined yet.
// Central Provident Fund (Amendment) Ordinance, 1955 (Ordinance 4 of 1955)

// An amendment to the ordinance was passed on 29 Jun 1955 to, among other things, postpone the commencement from 1 May
// to 1 Jul 1955 (thus amending the ordinance prior to commencement), and to exempt workers earning <$200 from having to
// make the employee contribution.
// Ref: Central Provident Fund (Amendment No. 2) Ordinance, 1955 (Ordinance 15 of 1955).
// Gazette Notification No. ___ in Gazette No. __ dated 1 Jul 1955 (page 889).
// Gazette Notification No. S 186 in Gazette Supplement No. 51 dated 1 Jul 1955 (page 1037).
// Passed by Meeting of the Legislative Assembly on 29 Jun 1955, Governor's assent on 1 Jul 1955.
function cpfContribution195507(params) {
  const wage = params['wage'];

  let employee = new BigNumber(0);
  let employer = new BigNumber(0);

  // This could also be implemented as a large lookup table, but because the contributions are denominated in cents, it
  // would be a rather large table to cover wages from $10.00 to $500.00. It is certainly possible to instantiate the
  // lookup table programmatically at runtime instead of hard-writing it here, but let's write something that hews a
  // bit closer to the Schedule in the amended Ordinance instead, for easier human inspection.
  // In the calculation of 5 per centum of any sum fractions of a cent shall be ignored
  if (wage.isGreaterThan('10') && wage.isLessThanOrEqualTo('200')) {
    // When the wages exceed $10 but not $200
    // no employee contribution
    employer = roundDownToCent(wage.times('0.05'));
  } else if (wage.isGreaterThan('200') && wage.isLessThanOrEqualTo('210.50')) {
    // When the wages exceed $200 but not $210.50
    // employee contribution of the difference between $200 and the wages
    employee = wage.minus('200.00');
    employer = roundDownToCent(wage.times('0.05'));
  } else if (wage.isGreaterThan('210.50') && wage.isLessThanOrEqualTo('500.00')) {
    // When the wages exceed $210.50 but not $500
    employee = roundDownToCent(wage.times('0.05'));
    employer = roundDownToCent(wage.times('0.05'));
  } else if (wage.isGreaterThan('500.00')) {
    employee = new BigNumber('25');
    employer = new BigNumber('25');
  }

  return {
    'employee_contribution': employee,
    'employer_contribution': employer,
  };
}


// Money helper utils -- temp park here, though it seems like it could end up as a separate util module
function formatDollarAmount(amount) {
  // assume that this currency is always two decimal place
  return amount.toFixed(2);
}

function roundOffToDollar(amount) {
  // 50 cents to round up to full dollar, "round half up"
  return amount.integerValue(BigNumber.ROUND_HALF_UP);
}

function roundUpToDollar(amount) {
  return amount.integerValue(BigNumber.ROUND_UP);
}

function roundDownToDollar(amount) {
  // drop the cents
  return amount.integerValue(BigNumber.ROUND_DOWN);
}

function roundDownToCent(amount) {
  return amount.decimalPlaces(2, BigNumber.ROUND_DOWN);
}

exports.cpfContribution = cpfContribution;
exports.cpfContribution195505 = cpfContribution195505;
exports.roundOffToDollar = roundOffToDollar;
exports.roundUpToDollar = roundUpToDollar;
exports.roundDownToDollar = roundDownToDollar;
exports.roundDownToCent = roundDownToCent;
