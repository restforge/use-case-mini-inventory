-- Dialect: PostgreSQL
-- Widget: outbound_this_months (key: value)
-- Output columns: value (single row, scalar collapse to primitive)
-- Total outbound value current year

SELECT COALESCE(SUM(total_amount), 0) AS value
FROM stock_outbound
WHERE date_trunc('year', outbound_date) = date_trunc('year', CURRENT_DATE)
  AND status != 'cancelled';
