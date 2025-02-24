import * as shopifyProductsService from '@/services/shopify/products.server';
import * as orderchampProductsService from '@/services/orderchamp/products.server';
import * as faireProductsService from '@/services/faire/products.server';
import prisma from '@/db.server';
import { AdminApiContextWithoutRest } from 'node_modules/@shopify/shopify-app-remix/dist/ts/server/clients';
import { Platform } from '@/types';
import { Metafield } from './shopify/types';
import { updateProductsQuantity } from './cron.server';

export const syncProducts = async (
  graphqlClient: AdminApiContextWithoutRest['graphql'],
  storeDomain: string,
  type: 'full' | 'part',
) => {
  try {
    const store = await prisma.store.findFirst({
      where: {
        domain: storeDomain,
      },
    });

    if (!store) {
      throw new Error('Store not found.');
    }

    const lastProductsSync = new Date(store.lastProductsSyncAt).toISOString();

    const shopifyProducts = await shopifyProductsService.retrieveAllProducts(
      graphqlClient,
      type === 'part' ? `created_at:>${lastProductsSync}` : undefined,
    );

    const storeName = storeDomain.replace('.myshopify.com', '');

    for (const product of shopifyProducts) {
      const { metafields, platformPrice } =
        await shopifyProductsService.retrieveMetafields(
          graphqlClient,
          product.id,
          Object.values(Metafield),
        );

      const platformMetadata = (metafields[Metafield.Platforms] ||
        []) as Platform[];

      const productId = product.id.split('/').at(-1);

      const productFromDB = await prisma.product.upsert({
        where: {
          shopifyStorefrontId: product.id,
        },
        create: {
          storeDomain,
          hasOnlyDefaultVariant: product.hasOnlyDefaultVariant,
          variantsCount: product.variantsCount.count,
          totalInventory: product.totalInventory,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          shopifyStorefrontId: product.id,
        },
        update: {
          hasOnlyDefaultVariant: product.hasOnlyDefaultVariant,
          variantsCount: product.variantsCount.count,
          totalInventory: product.totalInventory,
          updatedAt: product.updatedAt,
        },
        include: {
          platformProducts: true,
          variants: {
            include: {
              platformProductVariants: true,
            },
          },
        },
      });

      await prisma.platformProduct.upsert({
        where: {
          storefrontId: product.id,
        },
        create: {
          product: { connect: { id: productFromDB.id } },
          storefrontId: product.id,
          title: product.title,
          category: product.category.name || 'Uncategorized',
          platform: Platform.Shopify,
          tags: product.tags,
          description: product.descriptionHtml,
          sourceUrl: `https://admin.shopify.com/store/${storeName}/products/${productId}`,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
        update: {
          title: product.title,
          status: product.status,
          category: product.category.name,
          description: product.descriptionHtml,
          tags: product.tags,
          updatedAt: product.updatedAt,
        },
      });

      for (const variant of product.variants.nodes) {
        const variantId = variant.id.replace(
          'gid://shopify/ProductVariant/',
          '',
        );

        const createdVariant = await prisma.productVariant.upsert({
          where: {
            shopifyProductStorefrontId_shopifyVariantStorefrontId: {
              shopifyProductStorefrontId: product.id,
              shopifyVariantStorefrontId: variant.id,
            },
          },
          create: {
            product: { connect: { id: productFromDB.id } },
            sku: variant?.sku || `${variantId}-temp-sku`,
            inventoryQuantity: variant.inventoryQuantity,
            shopifyVariantStorefrontId: variant.id,
            shopifyProductStorefrontId: product.id,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          },
          update: {
            sku: variant?.sku || `${variantId}-temp-sku`,
            inventoryQuantity: variant.inventoryQuantity,
            updatedAt: variant.updatedAt,
          },
        });

        await prisma.platformProductVariant.upsert({
          where: {
            storefrontId: variant.id,
          },
          create: {
            productVariant: { connect: { id: createdVariant.id } },
            storefrontId: variant.id,
            title: variant.title,
            price: variant.price,
            barcode: variant?.barcode || variantId,
            platform: Platform.Shopify,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          },
          update: {
            title: variant.title,
            price: variant.price,
            barcode: variant.barcode,
            updatedAt: variant.updatedAt,
          },
        });
      }

      if (platformMetadata.includes(Platform.Orderchamp)) {
        const marketplaceStorefront = (metafields[
          Metafield.OrderchampMarketplace
        ] || [])?.[0];

        const productCategory = (metafields[
          Metafield.OrderchampProductCategory
        ] || [])?.[0];

        const mappedProductVariants = product.variants.nodes.map((variant) => ({
          ...variant,
          msrp: variant.price || '0.01',
          price: platformPrice || variant.price || '0.01',
        }));

        const mappedProduct = {
          ...product,
          variants: {
            nodes: mappedProductVariants,
          },
        };

        await orderchampProductsService.syncProduct(
          mappedProduct,
          productCategory,
          marketplaceStorefront,
        );
      }

      if (platformMetadata.includes(Platform.Faire)) {
        const productCategory = (metafields[Metafield.FaireCategory] ||
          [])?.[0];

        const mappedProductVariants = product.variants.nodes.map((variant) => ({
          ...variant,
          msrp: String(+variant.price || 0.01),
          price: String(+platformPrice || +variant.price || 0.01),
        }));

        const mappedProduct = {
          ...product,
          variants: {
            nodes: mappedProductVariants,
          },
        };

        await faireProductsService.syncProduct(mappedProduct, productCategory);
      }
    }

    await updateProductsQuantity(type);

    await prisma.store.update({
      where: {
        domain: storeDomain,
      },
      data: {
        lastProductsSyncAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('An error occurred while sync products: ', err?.message);
  }
};
