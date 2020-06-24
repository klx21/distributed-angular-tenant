import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { LoDashStatic } from 'lodash';

declare var _: LoDashStatic;
declare var window: any;

@NgModule({
  imports: [
    RouterModule.forRoot(NgAppRoutingModule.getRoutesFromMicroservices(), {
      useHash: false,
      initialNavigation: true,
      enableTracing: false
    })
  ],
  exports: [
    RouterModule
  ]
})
export class NgAppRoutingModule {

  /**
   * Use routes found by loadMicroservicesUI
   * from ng2 moduleConfig.json files
   */
  public static getRoutesFromMicroservices(): Route[] {
    let routes: Route[] = [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'applications'
      }
    ];

    if (window.additionalRoutes && window.additionalRoutes.length > 0) {
      routes = _.uniqBy(routes.concat(_.map(window.additionalRoutes, NgAppRoutingModule.guardRoute)), 'path');
    }

    return routes;
  }

  private static guardRoute(route: Route) {
    return route;
  }
}
