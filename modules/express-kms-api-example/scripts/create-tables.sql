-- TODO: delete this comments! questions for Pranav/Mohammad
-- Some fields with VARCHAR(X) not sure how many characters
-- do we need for a coin.

-- I took the fields from the TDD doc on page 3
-- Not sure also about the prv and pub key length, should we limit them?
CREATE TABLE PRIVATE_KEYS(
    id TEXT PRIMARY KEY,
    coin VARCHAR(30) NOT NULL,
    source VARCHAR(15) CHECK(source IN ('user', 'backup')) NOT NULL,
    type VARCHAR(15) CHECK(type IN ('independent', 'tss')) NOT NULL,
    prv TEXT NOT NULL,
    pub TEXT NOT NULL);
