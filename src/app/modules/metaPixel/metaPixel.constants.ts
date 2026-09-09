export const GRAPH_API_VERSION = "v21.0";

export const META_STANDARD_EVENTS = [
  "AddPaymentInfo",
  "AddToCart",
  "AddToWishlist",
  "CompleteRegistration",
  "Contact",
  "CustomizeProduct",
  "Donate",
  "FindLocation",
  "InitiateCheckout",
  "Lead",
  "PageView",
  "Purchase",
  "Schedule",
  "Search",
  "StartTrial",
  "SubmitApplication",
  "Subscribe",
  "ViewContent",
] as const;

export type IMetaPixelTriggerDef = {
  key: string;
  label: string;
  description: string;
  backendVisible: boolean;
  defaultEventName: string;
  defaultEnabled: boolean;
};

export const TRIGGER_REGISTRY = [
  {
    key: "page_view",
    label: "Any page view",
    description: "Fires on every storefront route change.",
    backendVisible: false,
    defaultEventName: "PageView",
    defaultEnabled: true,
  },
  {
    key: "product_view",
    label: "Product detail page",
    description: "A customer opens a single product page.",
    backendVisible: false,
    defaultEventName: "ViewContent",
    defaultEnabled: true,
  },
  {
    key: "category_view",
    label: "Category listing page",
    description: "A customer opens a category or brand listing.",
    backendVisible: false,
    defaultEventName: "ViewContent",
    defaultEnabled: true,
  },
  {
    key: "search",
    label: "Search performed",
    description: "A customer submits a search query.",
    backendVisible: false,
    defaultEventName: "Search",
    defaultEnabled: true,
  },
  {
    key: "add_to_cart",
    label: "Add to cart",
    description: "A product is added to the cart.",
    backendVisible: true,
    defaultEventName: "AddToCart",
    defaultEnabled: true,
  },
  {
    key: "cart_view",
    label: "Cart page",
    description: "A customer opens the cart page.",
    backendVisible: false,
    defaultEventName: "",
    defaultEnabled: false,
  },
  {
    key: "wishlist_add",
    label: "Add to wishlist",
    description: "A product is saved to the wishlist.",
    backendVisible: false,
    defaultEventName: "AddToWishlist",
    defaultEnabled: true,
  },
  {
    key: "compare_add",
    label: "Add to compare",
    description: "A product is added to the compare list.",
    backendVisible: false,
    defaultEventName: "",
    defaultEnabled: false,
  },
  {
    key: "checkout_start",
    label: "Checkout started",
    description: "A customer reaches the checkout page.",
    backendVisible: true,
    defaultEventName: "InitiateCheckout",
    defaultEnabled: true,
  },
  {
    key: "checkout_success",
    label: "Order placed",
    description:
      "An order is created successfully. Off by default because Purchase is sent when an order reaches its configured status instead.",
    backendVisible: true,
    defaultEventName: "",
    defaultEnabled: false,
  },
  {
    key: "signup",
    label: "Account created",
    description: "A customer completes registration.",
    backendVisible: true,
    defaultEventName: "CompleteRegistration",
    defaultEnabled: true,
  },
  {
    key: "login",
    label: "Login",
    description: "A customer signs in.",
    backendVisible: true,
    defaultEventName: "",
    defaultEnabled: false,
  },
  {
    key: "pc_builder_save",
    label: "PC build saved",
    description: "A customer saves a PC build.",
    backendVisible: true,
    defaultEventName: "CustomizeProduct",
    defaultEnabled: true,
  },
  {
    key: "contact_submit",
    label: "Contact form submitted",
    description: "A customer submits a contact or enquiry form.",
    backendVisible: true,
    defaultEventName: "Contact",
    defaultEnabled: true,
  },
] as const satisfies readonly IMetaPixelTriggerDef[];

export type TMetaTriggerKey = (typeof TRIGGER_REGISTRY)[number]["key"];

export const TRIGGER_KEYS = TRIGGER_REGISTRY.map((t) => t.key) as string[];

export const BACKEND_VISIBLE_KEYS = TRIGGER_REGISTRY.filter(
  (t) => t.backendVisible,
).map((t) => t.key) as string[];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
