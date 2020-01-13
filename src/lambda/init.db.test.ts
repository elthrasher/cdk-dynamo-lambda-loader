import { CloudFormationCustomResourceEventCommon } from 'aws-lambda';

const db = {
  batchWrite: jest.fn(() => {
    return { promise: (): Promise<void> => Promise.resolve() };
  }),
};

class MockDynamoClient {
  constructor() {
    return db;
  }
}

jest.mock('aws-sdk', () => {
  return {
    DynamoDB: {
      DocumentClient: MockDynamoClient,
    },
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
      ResourceProperties: {
        ServiceToken: 'abc123',
      },
    } as CloudFormationCustomResourceEventCommon;
    event.ResourceProperties['DesiredCount'] = 50;
    event.ResourceProperties['ReadWriteCapacity'] = 25;
    event.ResourceProperties['TableName'] = 'friends';

    await handler(event);
    expect(db.batchWrite).toBeCalledTimes(2);
    expect(console.log).toBeCalledTimes(2);
  });
});
