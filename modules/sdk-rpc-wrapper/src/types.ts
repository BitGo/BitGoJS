export interface EVMRPCRequest {
  id?: number | string;
  jsonrpc?: string;
  method: string;
  params: string[];
}

export interface EVMRPCResult {
  id?: number | string;
  jsonrpc?: string;
  result: string;
}
