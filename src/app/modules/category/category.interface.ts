export interface TCategory {
  _id?: string;
  name: string;
  parent_id: string;
  product_details_categories: string[];
  subCategories?: TCategory[];
  isDeleted: Boolean;
  isFeatured: Boolean;
  image: string;
  description?: string;
  slug: string;
}

export interface TUpdateCategory {
  name: string;
  product_details_categories: string[];
  slug: string;
}
