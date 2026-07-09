import { product } from "./product";
import { siteSettings } from "./site-settings";
import { flashSaleSettings } from "./flash-sale-settings";
import { flashSaleSectionSettings } from "./flash-sale-section-settings";
import { conversionRescueSettings } from "./conversion-rescue-settings";
import { quantityDiscountSettings } from "./quantity-discount-settings";
import { sizeGuideSettings } from "./size-guide-settings";
import { paymentDiscountSettings } from "./payment-discount-settings";
import { discountCode } from "./discount-code";
import { checkoutPopupSettings } from "./checkout-popup-settings";
import { productReview } from "./product-review";
import { referralProgram } from "./referral-program";
import { referralRecord } from "./referral-record";

export const schemaTypes = [
  product,
  siteSettings,
  flashSaleSettings,
  flashSaleSectionSettings,
  conversionRescueSettings,
  quantityDiscountSettings,
  sizeGuideSettings,
  paymentDiscountSettings,
  discountCode,
  checkoutPopupSettings,
  referralProgram,
  referralRecord,
  productReview,
];
