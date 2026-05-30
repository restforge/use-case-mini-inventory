call npx restforge endpoint create --project=mini-inventory --name=category --payload=category.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=warehouse --payload=warehouse.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=supplier --payload=supplier.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=customer --payload=customer.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=item-product --payload=item-product.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=stock-inbound --payload=stock-inbound.json --force=true --config=db-connection.env
call npx restforge endpoint create --project=mini-inventory --name=stock-outbound --payload=stock-outbound.json --force=true --config=db-connection.env