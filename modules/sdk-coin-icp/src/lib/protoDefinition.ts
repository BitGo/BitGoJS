export const protoDefinition = `
syntax = "proto3";

message Memo {
  uint64 memo = 1;
}

message Tokens {
    uint64 e8s = 1;
}

message Payment {
    Tokens receiver_gets = 1;
}

message Subaccount {
  bytes sub_account = 1;
}

message AccountIdentifier {
    bytes hash = 1; 
}

message BlockIndex {
    uint64 height = 1;
}

message TimeStamp {
    uint64 timestamp_nanos = 1;
}

message SendRequest {
    Memo memo = 1;
    Payment payment = 2;
    Tokens max_fee = 3;
    Subaccount from_subaccount = 4;
    AccountIdentifier to = 5;
    BlockIndex created_at = 6;
    TimeStamp created_at_time = 7;
}`;
