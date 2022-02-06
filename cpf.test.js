const { expect, test } = require('@jest/globals');
const BigNumber = require('bignumber.js');

const cpf = require('./cpf.js');

const cpfContribution195505TestTable = [
  ['0.00', '0.00'],
  ['10.00', '0.00'],
  ['10.01', '1.50'],
  ['30.00', '1.50'],
  ['30.01', '2.00'],
  ['40.00', '2.00'],
  ['40.01', '3.00'],
  ['50.00', '3.00'],
  ['50.01', '3.50'],
  ['60.00', '3.50'],
  ['60.01', '4.00'],
  ['70.00', '4.00'],
  ['70.01', '4.50'],
  ['80.00', '4.50'],
  ['80.01', '5.00'],
  ['90.00', '5.00'],
  ['90.01', '5.50'],
  ['100.00', '5.50'],

  ['100.01', '6.00'],
  ['120.00', '6.00'],
  ['120.01', '7.00'],
  ['140.00', '7.00'],
  ['140.01', '8.00'],
  ['160.00', '8.00'],
  ['160.01', '9.00'],
  ['180.00', '9.00'],
  ['180.01', '10.00'],
  ['200.00', '10.00'],

  ['200.01', '11.00'],
  ['220.00', '11.00'],
  ['220.01', '12.00'],
  ['240.00', '12.00'],
  ['240.01', '13.00'],
  ['260.00', '13.00'],
  ['260.01', '14.00'],
  ['280.00', '14.00'],
  ['280.01', '15.00'],
  ['300.00', '15.00'],

  ['300.01', '16.00'],
  ['320.00', '16.00'],
  ['320.01', '17.00'],
  ['340.00', '17.00'],
  ['340.01', '18.00'],
  ['360.00', '18.00'],
  ['360.01', '19.00'],
  ['380.00', '19.00'],
  ['380.01', '20.00'],
  ['400.00', '20.00'],

  ['400.01', '21.00'],
  ['420.00', '21.00'],
  ['420.01', '22.00'],
  ['440.00', '22.00'],
  ['440.01', '23.00'],
  ['460.00', '23.00'],
  ['460.01', '24.00'],
  ['480.00', '24.00'],
  ['480.01', '25.00'],
  ['500.00', '25.00'],

  ['500.01', '25.00'],
  ['1000.00', '25.00'],
];
test.each(cpfContribution195505TestTable)('CPF 1955-05 wage %s', (wage, expected_contribution) => {
  // converting from string to BigNumber is the responsibility of cpfContribution().
  // but because we are testing an inner function directly instead of going through cpfContribution()
  // (since this is a rate that was retroactively removed), need to make all the BigNumber ourselves.
  expect(cpf.cpfContribution195505({
    'contribution_date': new Date('1955-05-01'),
    'wage': new BigNumber(wage),
  })).toEqual(
    expect.objectContaining({
      'employee_contribution': new BigNumber(expected_contribution),
      'employer_contribution': new BigNumber(expected_contribution),
    })
  );
});

const cpfContribution195507TestTable = [
  // When the wages do not exceed $10, no contributions
  ['0.00', '0.00', '0.00'],
  ['10.00', '0.00', '0.00'],
  // When the wages exceed $10 but not $200, no employee contribution
  ['10.01', '0.00', '0.50'], // employer 0.5005 => 0.00
  ['20.00', '0.00', '1.00'],
  ['39.99', '0.00', '1.99'], // employer 1.9995 => 1.00
  ['40.00', '0.00', '2.00'],
  ['200.00', '0.00', '10.00'],
  // When the wages exceed $200 but not $210.50, employee contribution ramps up to nearly meet employer contribution
  ['200.01', '0.01', '10.00'], // employer 10.0005 => 10.00
  ['210.50', '10.50', '10.52'], // employer 10.5250 => 10.52 (round down even if half cent)
  // When the wages exceed $210.50 but not $500, both contribute the same 5%
  ['210.51', '10.52', '10.52'], // 10.5255 => 10.52
  ['210.60', '10.53', '10.53'],
  ['499.99', '24.99', '24.99'], // 24.9995 => 24.99
  ['500.00', '25.00', '25.00'],
  // When the wages exceed $500, both contribute $25
  ['500.01', '25.00', '25.00'],
  ['1000.00', '25.00', '25.00'],
];
test.each(cpfContribution195507TestTable)('CPF 1955-07 wage %s', (wage, employee_contribution, employer_contribution) => {
  expect(cpf.cpfContribution({
    'contribution_date': new Date('1955-07-01'),
    'wage': wage,
  })).toEqual(
    expect.objectContaining({
      'employee_contribution': employee_contribution,
      'employer_contribution': employer_contribution,
    })
  );
});


// Money helper utils

test('roundOffToDollar', () => {
  // 50 cents should round up
  expect(cpf.roundOffToDollar(new BigNumber('0.50'))).toEqual(new BigNumber('1.00'));
  // 49 cents should round down
  expect(cpf.roundOffToDollar(new BigNumber('0.49'))).toEqual(new BigNumber('0.00'));

  // 50 cents should always round up, not to even
  expect(cpf.roundOffToDollar(new BigNumber('1.50'))).toEqual(new BigNumber('2.00'));
  expect(cpf.roundOffToDollar(new BigNumber('2.50'))).toEqual(new BigNumber('3.00'));
});

test('roundUpToDollar', () => {
  expect(cpf.roundUpToDollar(new BigNumber('0.50'))).toEqual(new BigNumber('1.00'));
  expect(cpf.roundUpToDollar(new BigNumber('0.49'))).toEqual(new BigNumber('1.00'));
  expect(cpf.roundUpToDollar(new BigNumber('1.01'))).toEqual(new BigNumber('2.00'));
});

test('roundDownToDollar', () => {
  // 50 cents should round down
  expect(cpf.roundDownToDollar(new BigNumber('0.50'))).toEqual(new BigNumber('0.00'));
  // 49 cents should round down
  expect(cpf.roundDownToDollar(new BigNumber('0.49'))).toEqual(new BigNumber('0.00'));

  // 50 cents should always round down, not to even
  expect(cpf.roundDownToDollar(new BigNumber('2.50'))).toEqual(new BigNumber('2.00'));
  expect(cpf.roundDownToDollar(new BigNumber('1.50'))).toEqual(new BigNumber('1.00'));
});

test('roundDownToCent', () => {
  // 50.1 cents should round down
  expect(cpf.roundDownToCent(new BigNumber('0.501'))).toEqual(new BigNumber('0.50'));
  // 50.9 cents should round down
  expect(cpf.roundDownToCent(new BigNumber('0.509'))).toEqual(new BigNumber('0.50'));
});
