-- Dialect: PostgreSQL
-- Widget: author_sales
-- Output columns: category, value
-- Sales total amount per customer city (simulasi sales by region)

SELECT
  c.city AS category,
  COALESCE(SUM(so.total_amount), 0) AS value
FROM stock_outbound so
JOIN customer c ON c.customer_id = so.customer_id
WHERE so.status != 'cancelled'
GROUP BY c.city
ORDER BY value DESC
LIMIT 12;
