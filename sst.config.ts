import { SSMClient } from '@aws-sdk/client-ssm';
import type { SSTConfig } from 'sst';
import { fetchSstSecret } from 'sst-secrets';
import { AstroSite, type StackContext } from 'sst/constructs';

export default {
    config(_input) {
        return {
            name: 'moosicbox-app',
            region: 'us-east-1',
        };
    },
    async stacks(app) {
        await app.stack(async ({ stack }: StackContext): Promise<void> => {
            const ssm = new SSMClient({ region: stack.region });
            const isProd = stack.stage === 'prod';
            const DOMAIN = await fetchSstSecret(
                ssm,
                app.name,
                'DOMAIN',
                stack.stage,
            );
            const slug = 'app';
            const subdomain = isProd ? slug : `${slug}-${stack.stage}`;
            const domainName = `${subdomain}.${DOMAIN}`;

            const site = new AstroSite(stack, 'MoosicBox', {
                buildCommand: 'pnpm build --config astro.config.sst.mjs',
                customDomain: {
                    hostedZone: DOMAIN,
                    domainName,
                },
            });

            stack.addOutputs({
                url: site.url,
                host: `https://${domainName}`,
            });
        });
    },
} satisfies SSTConfig;
