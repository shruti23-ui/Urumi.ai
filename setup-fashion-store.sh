#!/bin/bash
# Setup Fashion Boutique with products

NAMESPACE="store-fashion-boutique-d68c4615"
POD=$(kubectl get pods -n $NAMESPACE -l app=fashion-boutique -o jsonpath='{.items[0].metadata.name}')
MYSQL_POD="fashion-boutique-mysql-0"
MYSQL_PASS=$(kubectl get secret -n $NAMESPACE fashion-boutique-mysql-secret -o jsonpath='{.data.mysql-password}' | base64 -d)

echo "Setting up Fashion Boutique..."

# Fix WordPress URL
kubectl exec -n $NAMESPACE $MYSQL_POD -- mysql -u woocommerce -p$MYSQL_PASS woocommerce -e "UPDATE wp_options SET option_value='http://localhost:30190' WHERE option_name IN ('siteurl', 'home');"

# Setup in wp-setup container
kubectl exec -n $NAMESPACE $POD -c wp-setup -- bash -c "
cd /var/www/html

# Set permalinks
wp rewrite structure '/%postname%/' --allow-root
wp rewrite flush --allow-root

# Download fashion images
cd wp-content/uploads
curl -sL 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800' -o dress.jpg
curl -sL 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800' -o jacket.jpg
curl -sL 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800' -o handbag.jpg
curl -sL 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800' -o sunglasses.jpg
curl -sL 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800' -o heels.jpg

cd /var/www/html

# Import images
DRESS_ID=\$(wp media import wp-content/uploads/dress.jpg --porcelain --allow-root 2>/dev/null)
JACKET_ID=\$(wp media import wp-content/uploads/jacket.jpg --porcelain --allow-root 2>/dev/null)
HANDBAG_ID=\$(wp media import wp-content/uploads/handbag.jpg --porcelain --allow-root 2>/dev/null)
SUNGLASSES_ID=\$(wp media import wp-content/uploads/sunglasses.jpg --porcelain --allow-root 2>/dev/null)
HEELS_ID=\$(wp media import wp-content/uploads/heels.jpg --porcelain --allow-root 2>/dev/null)

echo \"Images imported: \$DRESS_ID, \$JACKET_ID, \$HANDBAG_ID, \$SUNGLASSES_ID, \$HEELS_ID\"

# Create Fashion Products
# Summer Dress
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='Summer Dress' --post_content='Beautiful floral summer dress perfect for any occasion.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 2500 --allow-root
wp post meta update \$PRODUCT_ID _price 2500 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 25 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$DRESS_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created Summer Dress\"

# Leather Jacket
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='Leather Jacket' --post_content='Premium leather jacket with modern design.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 5500 --allow-root
wp post meta update \$PRODUCT_ID _price 5500 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 15 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$JACKET_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created Leather Jacket\"

# Designer Handbag
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='Designer Handbag' --post_content='Elegant designer handbag for the modern woman.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 3500 --allow-root
wp post meta update \$PRODUCT_ID _price 3500 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 20 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$HANDBAG_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created Designer Handbag\"

# Sunglasses
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='Designer Sunglasses' --post_content='Stylish sunglasses with UV protection.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 1800 --allow-root
wp post meta update \$PRODUCT_ID _price 1800 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 30 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$SUNGLASSES_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created Designer Sunglasses\"

# High Heels
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='High Heels' --post_content='Comfortable and stylish high heels.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 3200 --allow-root
wp post meta update \$PRODUCT_ID _price 3200 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 18 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$HEELS_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created High Heels\"

# Clear cache
wp cache flush --allow-root
wp transient delete --all --allow-root

echo \"Fashion Boutique setup complete!\"
"

echo "Done!"
