import { EAppModules } from "./roles.interface";

export type TPermissionDef = {
  key: string;
  label: string;
  legacy: "read" | "create" | "update" | "delete";
};

export const MODULE_LABELS: Record<EAppModules, string> = {
  [EAppModules.product]: "Products",
  [EAppModules.orders]: "Orders",
  [EAppModules.user]: "Users",
  [EAppModules.role]: "Roles",
  [EAppModules.banner]: "Banner Builder",
  [EAppModules.deals]: "Deals",
  [EAppModules.category]: "Categories",
  [EAppModules.brand]: "Brands",
  [EAppModules.gallery]: "Gallery",
  [EAppModules.photo]: "Photos",
  [EAppModules.productFilter]: "Product Filters",
  [EAppModules.productDetails]: "Detail Categories",
  [EAppModules.bulkUpload]: "Bulk Upload",
  [EAppModules.settings]: "Settings",
};

export const PERMISSION_CATALOG = {
  [EAppModules.product]: [
    { key: "can_see_product_page", label: "See product page", legacy: "read" },
    {
      key: "can_read_all_products",
      label: "View all products",
      legacy: "read",
    },
    {
      key: "can_read_product_details",
      label: "View product details",
      legacy: "read",
    },
    { key: "can_create_product", label: "Create product", legacy: "create" },
    { key: "can_update_product", label: "Edit product", legacy: "update" },
    {
      key: "can_bulk_upload_products",
      label: "Bulk upload products",
      legacy: "create",
    },
    {
      key: "can_download_product_template",
      label: "Download product template",
      legacy: "read",
    },
  ],
  [EAppModules.orders]: [
    { key: "can_see_order_page", label: "See order page", legacy: "read" },
    { key: "can_read_all_orders", label: "View all orders", legacy: "read" },
    {
      key: "can_read_order_details",
      label: "View order details",
      legacy: "read",
    },
    {
      key: "can_update_order_status",
      label: "Update order status",
      legacy: "update",
    },
  ],
  [EAppModules.user]: [
    { key: "can_see_admin_page", label: "See admins page", legacy: "read" },
    {
      key: "can_see_customer_page",
      label: "See customers page",
      legacy: "read",
    },
    { key: "can_read_all_users", label: "View all users", legacy: "read" },
    {
      key: "can_read_user_details",
      label: "View user details",
      legacy: "read",
    },
    { key: "can_create_admin", label: "Create admin", legacy: "create" },
    { key: "can_delete_user", label: "Delete user", legacy: "delete" },
  ],
  [EAppModules.role]: [
    { key: "can_see_role_page", label: "See roles page", legacy: "read" },
    { key: "can_read_all_roles", label: "View all roles", legacy: "read" },
    { key: "can_create_role", label: "Create role", legacy: "create" },
    { key: "can_update_role", label: "Edit role", legacy: "update" },
    { key: "can_delete_role", label: "Delete role", legacy: "delete" },
  ],
  [EAppModules.banner]: [
    {
      key: "can_see_banner_page",
      label: "See banner builder page",
      legacy: "read",
    },
    {
      key: "can_read_all_banners",
      label: "View all banner templates",
      legacy: "read",
    },
    {
      key: "can_read_banner_details",
      label: "Open a banner template",
      legacy: "read",
    },
    {
      key: "can_create_banner",
      label: "Create banner template",
      legacy: "create",
    },
    {
      key: "can_update_banner",
      label: "Edit banner template",
      legacy: "update",
    },
    {
      key: "can_rename_banner",
      label: "Rename banner template",
      legacy: "update",
    },
    {
      key: "can_publish_banner",
      label: "Publish banner template",
      legacy: "update",
    },
    {
      key: "can_duplicate_banner",
      label: "Duplicate banner template",
      legacy: "create",
    },
    {
      key: "can_delete_banner",
      label: "Delete banner template",
      legacy: "delete",
    },
  ],
  [EAppModules.deals]: [
    { key: "can_see_deal_page", label: "See deals page", legacy: "read" },
    { key: "can_read_all_deals", label: "View all deals", legacy: "read" },
    {
      key: "can_read_deal_details",
      label: "View deal details",
      legacy: "read",
    },
    { key: "can_create_deal", label: "Create deal", legacy: "create" },
    { key: "can_update_deal", label: "Edit deal", legacy: "update" },
    {
      key: "can_manage_deal_products",
      label: "Add or remove deal products",
      legacy: "update",
    },
  ],
  [EAppModules.category]: [
    {
      key: "can_see_category_page",
      label: "See categories page",
      legacy: "read",
    },
    {
      key: "can_read_all_categories",
      label: "View all categories",
      legacy: "read",
    },
    {
      key: "can_read_category_details",
      label: "View category details",
      legacy: "read",
    },
    { key: "can_create_category", label: "Create category", legacy: "create" },
    { key: "can_update_category", label: "Edit category", legacy: "update" },
    { key: "can_delete_category", label: "Delete category", legacy: "delete" },
  ],
  [EAppModules.brand]: [
    { key: "can_see_brand_page", label: "See brands page", legacy: "read" },
    { key: "can_read_all_brands", label: "View all brands", legacy: "read" },
    { key: "can_create_brand", label: "Create brand", legacy: "create" },
    { key: "can_update_brand", label: "Edit brand", legacy: "update" },
    { key: "can_delete_brand", label: "Delete brand", legacy: "delete" },
  ],
  [EAppModules.gallery]: [
    {
      key: "can_read_all_folders",
      label: "View gallery folders",
      legacy: "read",
    },
    {
      key: "can_create_folder",
      label: "Create gallery folder",
      legacy: "create",
    },
    {
      key: "can_update_folder",
      label: "Edit gallery folder",
      legacy: "update",
    },
    {
      key: "can_delete_folder",
      label: "Delete gallery folder",
      legacy: "delete",
    },
  ],
  [EAppModules.photo]: [
    { key: "can_read_all_photos", label: "View photos", legacy: "read" },
    { key: "can_upload_photo", label: "Upload photo", legacy: "create" },
    { key: "can_delete_photo", label: "Delete photo", legacy: "delete" },
  ],
  [EAppModules.productFilter]: [
    { key: "can_see_filter_page", label: "See filters page", legacy: "read" },
    { key: "can_read_all_filters", label: "View all filters", legacy: "read" },
    { key: "can_create_filter", label: "Create filter", legacy: "create" },
    { key: "can_update_filter", label: "Edit filter", legacy: "update" },
    { key: "can_delete_filter", label: "Delete filter", legacy: "delete" },
  ],
  [EAppModules.productDetails]: [
    {
      key: "can_see_details_category_page",
      label: "See detail categories page",
      legacy: "read",
    },
    {
      key: "can_read_all_details_categories",
      label: "View all detail categories",
      legacy: "read",
    },
    {
      key: "can_create_details_category",
      label: "Create detail category",
      legacy: "create",
    },
    {
      key: "can_update_details_category",
      label: "Edit detail category",
      legacy: "update",
    },
    {
      key: "can_delete_details_category",
      label: "Delete detail category",
      legacy: "delete",
    },
  ],
  [EAppModules.bulkUpload]: [
    {
      key: "can_see_bulk_upload_page",
      label: "See bulk upload page",
      legacy: "read",
    },
    {
      key: "can_read_bulk_upload_history",
      label: "View bulk upload history",
      legacy: "read",
    },
  ],
  [EAppModules.settings]: [
    {
      key: "can_see_pc_builder_page",
      label: "See PC builder page",
      legacy: "read",
    },
    { key: "can_read_settings", label: "View settings", legacy: "read" },
    { key: "can_update_settings", label: "Update settings", legacy: "update" },
  ],
} as const satisfies Record<EAppModules, readonly TPermissionDef[]>;

export const ALL_PERMISSION_KEYS = new Set<string>();

// The admin resolves a key without naming its module, so a key appearing under
// two modules would silently grant both. Fail at boot instead.
for (const defs of Object.values(PERMISSION_CATALOG)) {
  for (const def of defs) {
    if (ALL_PERMISSION_KEYS.has(def.key)) {
      throw new Error(
        `Duplicate permission key in PERMISSION_CATALOG: ${def.key}`,
      );
    }
    ALL_PERMISSION_KEYS.add(def.key);
  }
}

// `as const` preserves the literal key strings so this resolves to a union of
// all 70 keys rather than `string`. That is what makes a typo at any of the 58
// route call sites a compile error instead of a route nobody can ever reach.
export type TPermissionKey =
  (typeof PERMISSION_CATALOG)[EAppModules][number]["key"];
