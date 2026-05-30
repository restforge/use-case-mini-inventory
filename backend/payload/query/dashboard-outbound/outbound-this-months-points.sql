-- Dialect: PostgreSQL
-- Widget: outbound_this_months (key: points)
-- Output columns: period, value
-- Daily outbound value current year untuk area chart

SELECT
  TO_CHAR(outbound_date, 'YYYY-MM') AS period,
  COALESCE(SUM(total_amount), 0) AS value
FROM stock_outbound
WHERE date_trunc('year', outbound_date) = date_trunc('year', CURRENT_DATE)
  AND status != 'cancelled'
GROUP BY TO_CHAR(outbound_date, 'YYYY-MM')
ORDER BY TO_CHAR(outbound_date, 'YYYY-MM');
