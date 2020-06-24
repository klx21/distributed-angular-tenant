import { AfterContentInit, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './ng-app.component.html',
  styleUrls: [
    './ng-app.component.less'
  ]
})
export class NgAppComponent implements OnInit, AfterContentInit {

  renderTime: string;

  constructor() {}

  ngOnInit() {}

  ngAfterContentInit() {
    this.renderTime = new Date().toLocaleString();
  }
}
