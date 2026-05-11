1.Feature: Login

Tested: 
 - Login with empty credentials → Error message shown
 - Login with wrong credentials → Invalid credentials message
 - Login with correct credentials → User logged in successfully
 - Logout - Logout successfull

Status - Working

 2.Feature: Add products

 Tested:
  - Add product with empty fields - not allowed
  - Add product with all fields - Product added successfully
  - Add product with all fields and multiple images - Product added successfully
  - Add product with all fields without images - error shown atleast one image is required
  - Add product with all fields and no variants - Product added successfully with no variants also in the homepage productcard shows sold out
  - Add product with per image size more than 4.5Mb - Error is shown
  - Add product with image size less than 4.5Mb - Product added successfully
  - Add product with multiple images - user can remove the particular image if user don't want

Status - Working



3.Feature: Update Product

Tested:
 - Changed the single field -clicked update product button updated successfully
 - Changed all the fields also single image - clicked update product button updated successfully
 - Changed all the fields also added multiple images - clicked update product button updated successfully
 - Changed the fields - instead updated product clicked cancel product back to normal
 - Removed some images - then clicked update product updated successfull
 - Removed all the variants - then clicked update product updated successfull in the homepage product card becomes sold out
 - Removed all the images then clicked update product button - shows error alteast one image is required
 - Deleted the product - Deleted successfully

Status - Working


4.Feature: Catalogue

Tested:
 - Product Card - image caurosel working
 - Product Card - user clicks buy now or cart button it shows please select an age label indication
 - Product Card - select the age - now user clicks cart button - product added to the cart
 - Product Card - select the age - now user clicks buy now button - if only one stock left (pop up shows only one left in the stock )
 - Product Card - select the age - now user clicks buy now button -more than one stock  (opens cart modal)
 - Product Card - Sold out product - user unable to click add to cart or buy now button

Status - Working



5.Feature: Cart Modal

Tested: Desktop Screen
 - Clicks pay button - errors shown in the shipping details form - all fields are required
 - Clicks pay button - filling all the fields - opens razorpay modal
 - Order Summary - shows list of products with price and quantity
 - Order Summary - increase and decrease quantity button working based on stock
 - Order Summary - decrease button - when clicked last product in the cart - product removed from the cart
 - Order Summary - remove button - product removed from the cart
 - Order Summary - if only one product in the cart - when click decrease button - product removed from the cart - empty cart will be shown - pay button will become hidden
 - Shipping details - Pincode validator is working
 - Shipping details - when enter phone number if already ordered before remaining details will be autofilled (working for mobile as well as desktop)

 Tested: Mobile Screen
 - Checkout Page - order summary will be shown - if items exist - proceed to shipping button shown
 - Checkout Page - after clicking proceed to shipping - shipping details will be shown - edit items button shown to got back to order summary


Status - Working



6.Feature: Payment

Tested:
 - Add single product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - enter correct details - payment success

 - Add multiple products to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - enter correct details - payment success

 - Add product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - user refresh the page - payment pending

 - Add product to cart - proceed to checkout - fill address -increase quantity based on stock - payment method -  payment gateway opens - user close the payment gateway - payment cancelled



7.Feature: Orders page
 - Back to Dashboard button - working - taking to dashboard
 - 