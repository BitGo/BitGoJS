1. When creating mock classes for testing that extend abstract classes, always implement all abstract methods from the parent class.
2. When testing message builder functionality:
  - Mock implementations need to provide all interface methods (getType, setPayload, etc.)
  - Include both success and error cases
  - Test integration between different components (factory → builder → message)
3. BitGoJS testing patterns:
  - Account-lib tests live in modules/account-lib/test/unit/
  - Coin-specific tests live in modules/sdk-coin-{coin}/test/unit/
  - Use sinon for mocking/stubbing dependencies
  - Use should.js for assertions
4. Test file organization:
  - Message builder factory tests belong in their own file (messageFactory.ts)
  - Coin-specific message tests belong in modules/sdk-coin-{coin}/test/unit/messages/
5. Key imports needed for message builder tests:
  - BaseMessageBuilderFactory, IMessageBuilder, MessageStandardType from @bitgo/sdk-core
  - Coin-specific MessageBuilderFactory from the relevant module