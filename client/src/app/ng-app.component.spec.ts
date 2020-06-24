import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgAppComponent } from './ng-app.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
        declarations: [
          NgAppComponent
        ],
        imports: [
          RouterTestingModule
        ]
      })
      .compileComponents();
  }));
  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(NgAppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app)
      .toBeTruthy();
  }));
  it(`should have as title 'TCI Web Server'`, async(() => {
    const fixture = TestBed.createComponent(NgAppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title)
      .toEqual(undefined);
  }));
  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(NgAppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent)
      .toContain('App component');
  }));
});
