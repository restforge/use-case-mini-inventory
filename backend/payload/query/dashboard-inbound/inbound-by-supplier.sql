-- Dialect: PostgreSQL
-- Widget: inbound_by_supplier
-- Output columns: label (supplier name), value (total inbound amount)
-- Filter: tahun via :year placeholder

SELECT
  s.supplier_name AS label,
  COALESCE(SUM(si.total_amount), 0) AS value
FROM stock_inbound si
JOIN supplier s ON s.supplier_id = si.supplier_id
WHERE si.status != 'cancelled'
  AND EXTRACT(YEAR FROM si.inbound_date) = :year
GROUP BY s.supplier_name
ORDER BY value DESC
LIMIT 10;
