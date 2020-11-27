import { CustomResource } from '@aws-cdk/aws-cloudformation';
import { AttributeType, Table } from '@aws-cdk/aws-dynamodb';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct, Duration, RemovalPolicy, Stack, StackProps } from '@aws-cdk/core';
import { Provider } from '@aws-cdk/custom-resources';

const lambdaPath = `${__dirname}/lambda`;

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

    const initDBLambda = new NodejsFunction(this, 'initDBFunction', {
      entry: `${lambdaPath}/init-db.ts`,
      externalModules: [],
      handler: 'handler',
      memorySize: 3000,
      minify: true,
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
