#!/bin/bash
# Setup Book Haven with products

NAMESPACE="store-book-haven-1a22a8e8"
POD=$(kubectl get pods -n $NAMESPACE -l app=book-haven -o jsonpath='{.items[0].metadata.name}')
MYSQL_POD="book-haven-mysql-0"
MYSQL_PASS=$(kubectl get secret -n $NAMESPACE book-haven-mysql-secret -o jsonpath='{.data.mysql-password}' | base64 -d)

echo "Setting up Book Haven..."

# Fix WordPress URL
kubectl exec -n $NAMESPACE $MYSQL_POD -- mysql -u woocommerce -p$MYSQL_PASS woocommerce -e "UPDATE wp_options SET option_value='http://localhost:31388' WHERE option_name IN ('siteurl', 'home');"

# Setup in wp-setup container
kubectl exec -n $NAMESPACE $POD -c wp-setup -- bash -c "
cd /var/www/html

# Set permalinks
wp rewrite structure '/%postname%/' --allow-root
wp rewrite flush --allow-root

# Download book images
cd wp-content/uploads
curl -sL 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800' -o book1.jpg
curl -sL 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800' -o book2.jpg
curl -sL 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800' -o book3.jpg
curl -sL 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800' -o book4.jpg
curl -sL 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800' -o book5.jpg

cd /var/www/html

# Import images
BOOK1_ID=\$(wp media import wp-content/uploads/book1.jpg --porcelain --allow-root 2>/dev/null)
BOOK2_ID=\$(wp media import wp-content/uploads/book2.jpg --porcelain --allow-root 2>/dev/null)
BOOK3_ID=\$(wp media import wp-content/uploads/book3.jpg --porcelain --allow-root 2>/dev/null)
BOOK4_ID=\$(wp media import wp-content/uploads/book4.jpg --porcelain --allow-root 2>/dev/null)
BOOK5_ID=\$(wp media import wp-content/uploads/book5.jpg --porcelain --allow-root 2>/dev/null)

echo \"Images imported: \$BOOK1_ID, \$BOOK2_ID, \$BOOK3_ID, \$BOOK4_ID, \$BOOK5_ID\"

# Create Book Products
# The Great Gatsby
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='The Great Gatsby' --post_content='Classic American novel by F. Scott Fitzgerald.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 350 --allow-root
wp post meta update \$PRODUCT_ID _price 350 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 50 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$BOOK1_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created The Great Gatsby\"

# To Kill a Mockingbird
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='To Kill a Mockingbird' --post_content='Timeless classic by Harper Lee.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 400 --allow-root
wp post meta update \$PRODUCT_ID _price 400 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 45 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$BOOK2_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created To Kill a Mockingbird\"

# 1984
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='1984' --post_content='Dystopian masterpiece by George Orwell.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 380 --allow-root
wp post meta update \$PRODUCT_ID _price 380 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 60 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$BOOK3_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created 1984\"

# Pride and Prejudice
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='Pride and Prejudice' --post_content='Romantic classic by Jane Austen.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 330 --allow-root
wp post meta update \$PRODUCT_ID _price 330 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 40 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$BOOK4_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created Pride and Prejudice\"

# The Hobbit
PRODUCT_ID=\$(wp post create --post_type=product --post_status=publish --post_title='The Hobbit' --post_content='Fantasy adventure by J.R.R. Tolkien.' --porcelain --allow-root)
wp post meta update \$PRODUCT_ID _regular_price 450 --allow-root
wp post meta update \$PRODUCT_ID _price 450 --allow-root
wp post meta update \$PRODUCT_ID _stock_status instock --allow-root
wp post meta update \$PRODUCT_ID _manage_stock yes --allow-root
wp post meta update \$PRODUCT_ID _stock 35 --allow-root
wp post meta update \$PRODUCT_ID _thumbnail_id \$BOOK5_ID --allow-root
wp post term set \$PRODUCT_ID product_visibility visible --allow-root
echo \"Created The Hobbit\"

# Clear cache
wp cache flush --allow-root
wp transient delete --all --allow-root

echo \"Book Haven setup complete!\"
"

echo "Done!"
