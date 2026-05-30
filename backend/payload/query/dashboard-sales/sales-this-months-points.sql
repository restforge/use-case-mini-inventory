-- Dialect: PostgreSQL
-- Widget: sales_this_months (key: points)
-- Output columns: period, value
-- Daily revenue current month untuk area chart

SELECT
  TO_CHAR(outbound_date, 'YYYY-MM-DD') AS period,
  COALESCE(SUM(total_amount), 0) AS value
FROM stock_outbound
WHERE date_trunc('month', outbound_date) = date_trunc('month', CURRENT_DATE)
  AND status != 'cancelled'
GROUP BY outbound_date
ORDER BY outbound_date;
