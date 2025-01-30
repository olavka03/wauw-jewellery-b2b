import fs from 'fs';
import { ApiVersion } from '@shopify/shopify-api';
import { shopifyApiProject, ApiType } from '@shopify/api-codegen-preset';
import type { IGraphQLConfig } from 'graphql-config';

function getConfig() {
  const config: IGraphQLConfig = {
    projects: {
      default: shopifyApiProject({
        apiType: ApiType.Admin,
        apiVersion: ApiVersion.Unstable,
        documents: ['./app/services/shopify/*.{js,ts,jsx,tsx}'],
      }),
    },
  };

  let extensions: string[] = [];
  try {
    extensions = fs.readdirSync('./extensions');
  } catch {
    // ignore if no extensions
  }

  for (const entry of extensions) {
    const extensionPath = `./extensions/${entry}`;
    const schema = `${extensionPath}/schema.graphql`;
    if (!fs.existsSync(schema)) {
      continue;
    }
    config.projects[entry] = {
      schema,
      documents: [`${extensionPath}/**/*.graphql`],
    };
  }

  return config;
}

module.exports = getConfig();
