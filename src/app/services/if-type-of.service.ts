import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IfTypeOfService {

  constructor() { }

}

export class IfTypeOf {
  public static build() {
    return new IfTypeOf();
  }

  handleObject: (item: object) => void;
  handleNumber: (item: number) => void;
  handleString: (item: string) => void;
  handleArray: (a: any[]) => void;
  handleClass: (item: any) => void;
  handleUndefined: () => void;
  classToHandle: any;

  constructor() {

  }

  ifUndefined(handle: () => void): IfTypeOf {
    this.handleUndefined = handle;
    return this;
  }

  ifNumber(handle: (n: number) => void): IfTypeOf {
    this.handleNumber = handle;
    return this;
  }

  ifObject(handle: (item: object) => void): IfTypeOf {
    this.handleObject = handle;
    return this;
  }

  ifString(handle: (item: string) => void): IfTypeOf {
    this.handleString = handle;
    return this;
  }

  ifArray<T>(item: (a: T[]) => void): IfTypeOf {
    this.handleArray = item;
    return this;
  }

  ifInstanceOf<T>(item: (a: T) => void): IfTypeOf {
    this.handleClass = item;
    return this;
  }

  of(item: any): void {
    if (typeof item === 'undefined') {
      if (typeof this.handleUndefined != 'undefined') {
        this.handleUndefined();
      };
    }
    if (typeof item === 'string') {
      if (typeof this.handleString != 'undefined') {
        this.handleString(item);
      };
    }
    if (typeof item === 'object') {
      if (Array.isArray(item) && (typeof this.handleArray != 'undefined')) {
        this.handleArray(item);
      } else if (this.classToHandle && item instanceof this.classToHandle) {
        this.handleClass(item);
      } else if (typeof this.handleObject != 'undefined') {
        this.handleObject(item);
      };
    }
  }

}
