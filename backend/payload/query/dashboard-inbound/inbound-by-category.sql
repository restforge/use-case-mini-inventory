-- Dialect: PostgreSQL
-- Widget: inbound_by_category
-- Output columns: label (category name), value (total qty received)
-- Filter: tahun via :year placeholder

SELECT
  c.category_name AS label,
  COALESCE(SUM(sii.qty_received), 0) AS value
FROM stock_inbound_item sii
JOIN item_product p ON p.item_product_id = sii.item_product_id
JOIN category c ON c.category_id = p.category_id
JOIN stock_inbound si ON si.stock_inbound_id = sii.stock_inbound_id
WHERE si.status != 'cancelled'
  AND EXTRACT(YEAR FROM si.inbound_date) = :year
GROUP BY c.category_name
ORDER BY value DESC
LIMIT 10;
