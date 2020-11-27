import { CloudFormationCustomResourceEventCommon } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { commerce, name, random } from 'faker';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  shoeSize: number;
  favoriteColor: string;
}

const db = new DocumentClient();

const generateItem = (): Friend => {
  return {
    id: random.uuid(),
    firstName: name.firstName(),
    lastName: name.lastName(),
    shoeSize: random.number({ max: 25, min: 1, precision: 0.1 }),
    favoriteColor: commerce.color(),
  };
};

const generateBatch = (batchSize = 25): { PutRequest: { Item: Friend } }[] => {
  return new Array(batchSize).fill(undefined).map(() => {
    return { PutRequest: { Item: generateItem() } };
  });
};

export const handler = async (event: CloudFormationCustomResourceEventCommon): Promise<void> => {
  const { ReadWriteCapacity, DesiredCount, TableName } = event.ResourceProperties;
  for (let i = 0; i < DesiredCount / ReadWriteCapacity; i++) {
    const batch = new Array(ReadWriteCapacity / 25)
      .fill(undefined)
      .map(() => db.batchWrite({ RequestItems: { [TableName]: generateBatch() } }).promise());
    try {
      await Promise.all(batch);
      console.log(`Batch ${i} complete. ${ReadWriteCapacity} items written.`);
    } catch (e) {
      console.error('Batch write failed! ', e);
    }
  }
};
