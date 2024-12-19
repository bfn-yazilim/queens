import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {

  set(name: string, value: any) {
    localStorage.setItem(name, JSON.stringify(value));
  }

  get(name: string) {
    return JSON.parse(localStorage.getItem(name));
  }

  getObject<TModel>(name: string) {
    let result: TModel = {} as TModel;
    try {
      const obj = localStorage.getItem(name);
      if (obj) {
        result = JSON.parse(obj);
      }
    } catch (error) {
      console.log(name, error);
    }

    return result;
  }

  remove(name: string) {
    return localStorage.removeItem(name);
  }

  clear() {
    localStorage.clear();
  }

  has(name: string) {
    return localStorage.getItem(name) !== null;
  }
}
