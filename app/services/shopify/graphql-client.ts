import { GraphQLClient } from 'graphql-request';

// const url =
//   'https://olavka-test-store.myshopify.com/admin/api/2025-01/graphql.json';
const url = 'https://info-65b6.myshopify.com/admin/api/2025-01/graphql.json';

const headers = {
  // 'X-Shopify-Access-Token': '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',
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN || '',
  'Content-Type': 'application/json',
};

export const shopifyGraphqlClient = new GraphQLClient(url, {
  headers,
  method: 'POST',
  errorPolicy: 'ignore',
});
