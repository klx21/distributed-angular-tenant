import { Route } from '@angular/router';
import { LoDashStatic } from 'lodash';

import { DaConfig, Importmaps } from '@da/common';

declare var _: LoDashStatic;
declare var $: any;
declare var System: any;
declare var window: any;

(function () {
  const tenants = [
    {
      name: 'tenant1',
      configUrl: 'http://localhost:3334/da-config.json'
    }
  ];

  getReady()
    .then(() => System.import('da-core'))
    .catch(error => {
      console.warn('Error bootstrapping the UI');
      console.warn(error);
    });

  function addAdditionalRoutes(routes: Route[]): void {
    if (!_.isArray(window.additionalRoutes)) {
      window.additionalRoutes = [];
    }
    const dedupedRoutes = _.uniqBy(routes, 'path');

    window.additionalRoutes.push(...dedupedRoutes);
  }

  function augmentImportmaps(tenantImportmapsJson: Importmaps[]): void {
    const coreImportmapsElement = $('script[type="systemjs-importmap"]');
    const coreImportmapsJson = JSON.parse(coreImportmapsElement.text());
    const mergedTenantImportmapsJson = _.merge.apply(null, [{}].concat(tenantImportmapsJson));

    coreImportmapsElement.text(
      JSON.stringify(
        _.merge(
          {},
          coreImportmapsJson,
          mergedTenantImportmapsJson
        )
      )
    );
  }

  function collectDaConfigs(): Promise<DaConfig[]> {
    return Promise.all(_.map(tenants, tenant => getDaConfig(tenant.configUrl)));
  }

  function getDaConfig(url: string): Promise<DaConfig> {
    return $
      .get(url)
      .catch(error => {
        console.warn('Error getting distributed apps configuration from the url ', url);
        console.warn(error);
        return null;
      });
  }

  function getReady(): Promise<any> {
    return collectDaConfigs()
      .then((daConfigs: DaConfig[]) => {
        const compactDaConfigs = _.compact(daConfigs);
        const tenantImportmapsJson = _.map(compactDaConfigs, (daConfig: DaConfig) => daConfig.importmaps || {});
        const tenantRoutes = _.map(compactDaConfigs, (daConfig: DaConfig) => daConfig.routes || []);

        augmentImportmaps(tenantImportmapsJson);
        addAdditionalRoutes(_.flatten(tenantRoutes));
      });
  }
}());
