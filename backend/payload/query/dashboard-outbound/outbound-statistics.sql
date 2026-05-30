-- Dialect: PostgreSQL
-- Widget: outbound_statistics
-- Output columns: label, value
-- Top outbound products by quantity shipped (top 6 untuk pie chart)

SELECT
  p.product_name AS label,
  COALESCE(SUM(soi.qty_shipped), 0) AS value
FROM stock_outbound_item soi
JOIN item_product p ON p.item_product_id = soi.item_product_id
JOIN stock_outbound so ON so.stock_outbound_id = soi.stock_outbound_id
WHERE so.status != 'cancelled'
GROUP BY p.product_name
ORDER BY value DESC
LIMIT 6;
