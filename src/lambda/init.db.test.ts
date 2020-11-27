import { CloudFormationCustomResourceEventCommon } from 'aws-lambda';

// `batchWrite` as a jest mock lets me fire my fake friends into the ether
// instead of call some real api. It also opens up `toBeCalledTimes`.
const db = {
  batchWrite: jest.fn(() => {
    return { promise: (): Promise<void> => Promise.resolve() };
  }),
};

// My code calls `new DynamoDB.DocumentClient()` and expects a
// db object with a batchWrite method
class MockDocumentClient {
  constructor() {
    return db;
  }
}

// jest mocks will fully mock a module as it's required,
// replacing it with my implementation.
jest.mock('aws-sdk/clients/dynamodb', () => {
  return {
    DocumentClient: MockDocumentClient,
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.console = { log: jest.fn() } as any;

describe('initialize the database', () => {
  test('handler', async () => {
    // Mocks must be loaded prior to import.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const handler = require('./init-db').handler;
    const event = {
      ResourceProperties: {},
    } as CloudFormationCustomResourceEventCommon;
    event.ResourceProperties.DesiredCount = 50;
    event.ResourceProperties.ReadWriteCapacity = 25;
    event.ResourceProperties.TableName = 'friends';

    await handler(event);
    expect(db.batchWrite).toBeCalledTimes(2);
    expect(console.log).toBeCalledTimes(2);
  });
});
