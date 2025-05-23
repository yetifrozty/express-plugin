import { BaseHooks } from "base-plugin-system";
import express, { RequestHandler } from "express";

type MaybePromise<T> = Promise<T> | T;

export interface ExpressHooks {
  initExpress: (app: express.Application) => MaybePromise<void>;
}

function pluginHasExpressHooks(plugin: any): plugin is ExpressHooks {
  return plugin.initExpress !== undefined;
}

export interface ExpressPlugin extends BaseHooks {
  name: "express";
  port: number;
}

function expressPlugin(): ExpressPlugin {
  let plugins: any[] = [];
  let port: number;
  let app: express.Application;
  return {
    name: "express",
    get port() {
      return port;
    },
    init: async (_plugins) => {
      plugins = _plugins;
      port = parseInt(process.env.PORT ?? "") || 5173;
    },
    postInit: async () => {
      app = express();

      const relevantPlugins = plugins.filter(pluginHasExpressHooks);
      for (const plugin of relevantPlugins) {
        await plugin.initExpress(app);
      }

      app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    },
  };
}

export { expressPlugin };