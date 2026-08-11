import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, formatDate, formatPhone, capitalizeFirst } from '../src/utils/formatters.js';

test('formatCurrency maneja números y valores inválidos', () => {
  assert.equal(formatCurrency(12.5), '$ 12.50');
  assert.equal(formatCurrency('7'), '$ 7.00');
  assert.equal(formatCurrency(null), '$ 0.00');
});

test('formatDate preserva fechas YYYY-MM-DD sin desfase por zona horaria', () => {
  assert.equal(formatDate('2026-08-10'), '10/08/2026');
  assert.equal(formatDate('valor-invalido'), '');
});

test('formatPhone normaliza teléfonos venezolanos de 11 dígitos', () => {
  assert.equal(formatPhone('0412 1234567'), '0412-1234567');
  assert.equal(formatPhone('123'), '123');
});

test('capitalizeFirst maneja cadenas vacías y capitaliza', () => {
  assert.equal(capitalizeFirst('gaby'), 'Gaby');
  assert.equal(capitalizeFirst(''), '');
});
