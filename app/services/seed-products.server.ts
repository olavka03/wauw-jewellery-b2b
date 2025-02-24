import { Platform } from '@/types';
import { mapPlatformProducts } from '@/utils/map-platform-products';
import { generateProductsSkuMap } from '@/utils/generate-products-sku-map';
import * as orderchampProductsService from '@/services/orderchamp/products.server';
import * as faireProductsService from '@/services/faire/products.server';
import * as ankorstoreProductsService from '@/services/ankorstore/products.server';
import prisma from '@/db.server';
import { OrderchampProduct } from './orderchamp/types';
import { FaireProduct } from './faire/types';

export const seedProducts = async (storeDomain: string) => {
  try {
    const shopifyProducts = await prisma.platformProduct.findMany({
      where: { platform: Platform.Shopify, product: { storeDomain } },
      include: {
        product: {
          include: {
            variants: {
              include: {
                platformProductVariants: {
                  where: {
                    platform: Platform.Shopify,
                  },
                },
              },
            },
          },
        },
      },
    });

    const mappedShopifyProducts = mapPlatformProducts(shopifyProducts);

    const productsSkuMap = generateProductsSkuMap(mappedShopifyProducts);

    const allOrderchampProducts =
      await orderchampProductsService.retrieveAllProducts();

    if ((allOrderchampProducts || [])?.length > 0) {
      await orderchampProductsService.importOrderchampProducts(
        allOrderchampProducts as OrderchampProduct[],
        productsSkuMap,
      );
    }

    const allFaireProducts = await faireProductsService.retrieveAllProducts();

    if ((allFaireProducts || [])?.length > 0) {
      await faireProductsService.importFaireProducts(
        allFaireProducts as FaireProduct[],
        productsSkuMap,
      );
    }

    await ankorstoreProductsService.importProducts();
  } catch (err) {
    console.error('An error occurred while seeding products: ', err?.message);
  }
};
