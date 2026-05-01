declare const process: {
  env: Record<string, string | undefined>;
};

declare module "node:http" {
  export type IncomingMessage = { method?: string; url?: string | undefined };
  export type ServerResponse = {
    writeHead(statusCode: number, headers?: Record<string, string>): void;
    end(data?: string): void;
  };
  export type Server = {
    listen(port: number, callback?: () => void): void;
    close(callback: (error?: Error) => void): void;
  };
  const http: {
    createServer(
      handler: (req: IncomingMessage, res: ServerResponse) => void
    ): Server;
  };
  export default http;
}

declare module "node:test" {
  const test: (name: string, fn: () => Promise<void> | void) => void;
  export default test;
}

declare module "node:assert/strict" {
  const assert: {
    equal(actual: unknown, expected: unknown): void;
    deepEqual(actual: unknown, expected: unknown): void;
  };
  export default assert;
}
