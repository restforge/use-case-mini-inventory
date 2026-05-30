-- Dialect: PostgreSQL
-- Widget: sales_this_months (key: value)
-- Output columns: value (single row, scalar collapse to primitive)
-- Total revenue current month

SELECT COALESCE(SUM(total_amount), 0) AS value
FROM stock_outbound
WHERE date_trunc('month', outbound_date) = date_trunc('month', CURRENT_DATE)
  AND status != 'cancelled';
