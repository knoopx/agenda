declare module "pegjs-backtrace" {
  class Tracer {
    constructor(input: string);
    getBacktraceString(): string;
  }
  export default Tracer;
}
