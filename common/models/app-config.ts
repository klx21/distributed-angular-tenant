import { Route } from '@angular/router';

export interface Importmaps {
  imports?: {
    [key: string]: string
  };
  scopes?: {
    [key: string]: {
      [key: string]: string
    }
  };
}
export interface DaConfig {
  importmaps?: Importmaps;
  routes?: Route[];
}
