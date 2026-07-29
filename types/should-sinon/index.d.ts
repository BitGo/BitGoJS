import { Assertion } from 'should';

declare module 'should' {
  interface Assertion {
    calledOnce: () => void;
    calledTwice: () => void;
    calledThrice: () => void;
    calledOnceWith: (...args: any[]) => void;
    calledWith: (...args: any[]) => void;
    callCount: (count: number) => void;
  }
  class Assertion {
    static add: (name: string, handler: (args: any[]) => void) => void;
  }
}
