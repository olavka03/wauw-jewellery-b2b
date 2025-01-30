import {
  PlatformProduct,
  PlatformProductVariant,
  Prisma,
  Product,
  ProductVariant,
} from '@prisma/client';
import { IndexFiltersProps } from '@shopify/polaris';
import { WebhookContext } from '@shopify/shopify-app-remix/server';
import { mapPlatformProducts } from './utils/map-platform-products';

export enum WebhookTopic {
  PRODUCTS_CREATE = 'PRODUCTS_CREATE',
  PRODUCTS_UPDATE = 'PRODUCTS_UPDATE',
  PRODUCTS_DELETE = 'PRODUCTS_DELETE',
  ORDERS_CREATE = 'ORDERS_CREATE',
  ORDERS_EDITED = 'ORDERS_EDITED',
  ORDERS_DELETE = 'ORDERS_DELETE',
  APP_UNINSTALLED = 'APP_UNINSTALLED',
  APP_SCOPES_UPDATE = 'APP_SCOPES_UPDATE',
  CUSTOMERS_DATA_REQUEST = 'CUSTOMERS_DATA_REQUEST',
  CUSTOMERS_REDACT = 'CUSTOMERS_REDACT',
  SHOP_REDACT = 'SHOP_REDACT',
}

export type WebhookHandler = (args: {
  webhookContext: WebhookContext;
  request: Request;
}) => Promise<Response | undefined>;

export type WebhookRecords = Partial<Record<WebhookTopic, WebhookHandler>>;

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT',
}

export enum ProductStatusFilter {
  All = 'All',
  Active = 'Active',
  Draft = 'Draft',
  Archive = 'Archive',
}

export enum Platform {
  Shopify = 'Shopify',
  Orderchamp = 'Orderchamp',
  Faire = 'Faire',
  Ankorstore = 'Ankorstore',
}

export enum ProductFilterOption {
  Query = 'query',
  Category = 'category',
  TotalInventory = 'totalInventory',
  Platform = 'platform',
  Tags = 'tags',
  Status = 'status',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export enum ProductSortOptionLabel {
  Title = 'Title',
  Category = 'Category',
  TotalInventory = 'Total Inventory',
  CreatedAt = 'Created Date',
  UpdatedAt = 'Updated Date',
}

export enum ProductSortOptionValue {
  Title = 'title',
  Category = 'category',
  TotalInventory = 'totalInventory',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export enum DirectionLabel {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

export enum Direction {
  Ascending = 'asc',
  Descending = 'desc',
}

export enum DirectionString {
  Ascending = 'A-Z',
  Descending = 'Z-A',
}

export enum DirectionDate {
  Ascending = 'Oldest first',
  Descending = 'Newest first',
}

export enum DirectionNumber {
  Ascending = 'Lowest to highest',
  Descending = 'Highest to lowest',
}

export enum InventoryPolicy {
  CONTINUE = 'CONTINUE',
  DENY = 'DENY',
}

export type SelectedSort = Array<
  NonNullable<IndexFiltersProps['sortOptions']>[number]['value']
>;

export interface PageInfo {
  startCursor: string;
  endCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  data: Awaited<T> | null;
  message?: string | null;
  success: boolean;
}

export interface UserError {
  field: string;
  message: string;
}

export type NullableType<T> = T | undefined | null;

export interface ProductWithPlatformData extends Product {
  variants: (ProductVariant & {
    platformProductVariants: PlatformProductVariant[];
  })[];
  platformProducts: PlatformProduct[];
}

export type PlatformProductWhereInput = Prisma.PlatformProductWhereInput;
export type PlatformProductVariantWhereInput =
  Prisma.PlatformProductVariantWhereInput;
export type ProductWhereInput = Prisma.ProductWhereInput;
export type ProductVariantWhereInput = Prisma.ProductVariantWhereInput;

export type ProductFields = Prisma.ProductScalarFieldEnum;
export type ProductVariantFields = Prisma.ProductScalarFieldEnum;
export type PlatformProductFields = Prisma.ProductScalarFieldEnum;
export type PlatformProductVariantProductFields = Prisma.ProductScalarFieldEnum;

export type ProductOrderBy =
  | Prisma.PlatformProductOrderByWithRelationInput
  | Prisma.PlatformProductOrderByWithRelationInput[];
