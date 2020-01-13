import { CustomResource } from '@aws-cdk/aws-cloudformation';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { AssetCode, Function, Runtime } from '@aws-cdk/aws-lambda';
import { Construct, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Provider } from '@aws-cdk/custom-resources';

const lambdaPath = `${__dirname}/lambda`;

interface IFriend {
  id: { S: string };
  firstName: { S: string };
  lastName: { S: string };
  shoeSize: { N: number };
  favoriteColor: { S: string };
}

export class CdkDynamoLambdaLoaderStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const TableName = 'friends';
    const ReadWriteCapacity = 40000;
    const DesiredCount = 1000000;

    // Create a table
    const friendsTable = new Table(this, 'FriendsTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      readCapacity: ReadWriteCapacity,
      removalPolicy: RemovalPolicy.DESTROY,
      tableName: TableName,
      writeCapacity: ReadWriteCapacity,
    });

    const initDBLambda = new Function(this, 'initDBFunction', {
      code: new AssetCode(lambdaPath),
      handler: 'init-db.handler',
      memorySize: 1200,
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.minutes(15),
    });

    friendsTable.grant(initDBLambda, 'dynamodb:BatchWriteItem');

    const initDbProvider = new Provider(this, 'initDBProvider', {
      onEventHandler: initDBLambda,
    });

    new CustomResource(this, 'initDBResource', {
      provider: initDbProvider,
      properties: {
        ReadWriteCapacity,
        DesiredCount,
        TableName,
      },
    });
  }
}
