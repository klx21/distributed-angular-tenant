import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { NgAppComponent } from './ng-app.component';
import { NgTenantAppRoutingModule } from './ng-tenant-app-routing.module';

/* This is for AoT readiness. */
export function translateLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './locales/', '_US.json');
}

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgTenantAppRoutingModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: translateLoaderFactory,
        deps: [
          HttpClient
        ]
      }
    })
  ],
  declarations: [
    NgAppComponent
  ],
  exports: [
    NgAppComponent
  ],
  providers: []
})
export class NgTenantAppModule {
  constructor(
    public router: Router,
    private translate: TranslateService
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    console.log('From NgTenantAppModule, router config: ', this.router.config);
  }

  ngDoBootstrap() {
    // Do NOT remove this method even though it does nothing.
  }
}
