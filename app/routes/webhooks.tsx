import type { ActionFunctionArgs } from '@remix-run/node';

import { authenticate, unauthenticated } from '@/shopify.server';
import { webhookHandlers } from '@/api/webhooks/shopify';
import { WebhookTopic } from '@/types';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const shop = request.headers.get('x-shopify-shop-domain') as string;
  const topic = (request.headers.get('x-shopify-topic') as string)
    .replace('/', '_')
    .toUpperCase() as WebhookTopic;

  const { admin } = await unauthenticated.admin(shop);

  if (!admin) {
    throw new Response();
  }

  if (!WebhookTopic[topic]) {
    return new Response('Unhandled webhook topic', { status: 404 });
  }

  if (
    [
      WebhookTopic.CUSTOMERS_REDACT,
      WebhookTopic.SHOP_REDACT,
      WebhookTopic.CUSTOMERS_DATA_REQUEST,
    ].includes(topic as WebhookTopic)
  ) {
    return Response.json({ message: 'OK' }, { status: 200 });
  }

  const webhookHandler = webhookHandlers[topic as WebhookTopic];

  if (!webhookHandler) {
    throw new Response('Unhandled webhook topic', { status: 404 });
  }

  const response = await webhookHandler({
    request,
    shop,
    graphql: admin.graphql,
  });

  return response || null;
};
