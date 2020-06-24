import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgAppComponent } from './ng-app.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: NgAppComponent
      }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class NgTenantAppRoutingModule {}
