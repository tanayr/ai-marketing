// Extend Fabric.js typings for the version 6+
declare module 'fabric' {
  interface IObjectOptions {
    id?: string;
    name?: string;
  }
  
  interface Object {
    id?: string;
    name?: string;
  }
  
  interface Canvas {
    getCenter(): { top: number; left: number };
  }
  
  interface IEvent {
    target?: Object;
  }
}
