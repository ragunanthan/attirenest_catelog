1.Feature: Login

Tested: 
 - Login with empty credentials → Error message shown
 - Login with wrong credentials → Invalid credentials message
 - Login with correct credentials → User logged in successfully
 - Logout 

Status - Working

 2.Feature: Add products

 Tested:
  - Add product with empty fields - not allowed
  - Add product with all fields - Product added successfully
  - Add product with all fields and multiple images - Product added successfully
  - Add product with all fields without images - error shown atleast one image is required
  - Add product with all fields and no variants - Product added successfully with no variants
  - Add product with per image size more than 4.5Mb - Error is shown
  - Add product with image size less than 4.5Mb - Product added successfully
  - Add product with multiple images - user can remove the particular image if user don't want

Status - Working



3.Feature: Update Product

Tested:
 - 







4.Feature: Catalogue

Tested:
 - Product Card - image caurosel working
 - Product Card - user clicks buy now or cart button it shows first select the age
 - Product Card - select the age - now user clicks buy now or cart button - it opens the payment modal





5.Feature: Payment

Tested:
 - Add single product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - enter correct details - payment success

 - Add multiple products to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - enter correct details - payment success

 - Add product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - user refresh the page - payment pending

 - Add product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - user close the payment gateway - payment cancelled