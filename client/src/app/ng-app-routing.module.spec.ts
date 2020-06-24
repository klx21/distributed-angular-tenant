import { NgAppRoutingModule } from './ng-app-routing.module';

describe('AppRoutingModule', () => {
  let appRoutingModule: NgAppRoutingModule;

  beforeEach(() => {
    appRoutingModule = new NgAppRoutingModule();
  });

  it('should create an instance', () => {
    expect(appRoutingModule)
      .toBeTruthy();
  });
});
