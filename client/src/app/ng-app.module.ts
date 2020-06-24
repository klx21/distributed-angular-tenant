import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { NgAppRoutingModule } from './ng-app-routing.module';
import { NgAppComponent } from './ng-app.component';

/* This is for AoT readiness. */
export function translateLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './locales/', '_US.json');
}

@NgModule({
  imports: [
    NgAppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
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
  providers: [],
  bootstrap: [
    NgAppComponent
  ]
})
export class NgAppModule {
  constructor(
    public router: Router,
    private translate: TranslateService
  ) {
    // this language will be used as a fallback when a translation isn't found in the current language
    translate.setDefaultLang('en');

    // the lang to use, if the lang isn't available, it will use the current loader to get them
    translate.use('en');

    console.log('router config: ', this.router.config);
  }

  ngDoBootstrap() {
    // Do NOT remove this method even though it does nothing.
  }
}
