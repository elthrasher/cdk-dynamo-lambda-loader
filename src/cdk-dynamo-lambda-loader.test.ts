import { countResources, expect, haveResource, ResourcePart } from '@aws-cdk/assert';
import { App } from '@aws-cdk/core';

import { CdkDynamoLambdaLoaderStack } from './cdk-dynamo-lambda-loader-stack';

test('Create Dynamo Table', () => {
  const app = new App();
  // WHEN
  const stack = new CdkDynamoLambdaLoaderStack(app, 'MyTestStack');
  // THEN
  expect(stack).to(
    haveResource(
      'AWS::DynamoDB::Table',
      {
        Properties: {
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH',
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S',
            },
          ],
        },
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      },
      ResourcePart.CompleteDefinition,
      true,
    ),
  );
});

test('Lambda Resources', () => {
  const app = new App();
  // WHEN
  const stack = new CdkDynamoLambdaLoaderStack(app, 'MyTestStack');
  // THEN
  expect(stack).to(countResources('AWS::IAM::Role', 2));
  expect(stack).to(countResources('AWS::IAM::Policy', 2));
  expect(stack).to(
    haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'init-db.handler',
        Runtime: 'nodejs12.x',
        MemorySize: 1200,
        Timeout: 900,
      },
      ResourcePart.Properties,
      true,
    ),
  );
  expect(stack).to(
    haveResource('AWS::Lambda::Function', {
      Handler: 'framework.onEvent',
      Runtime: 'nodejs10.x',
      Timeout: 900,
    }),
  );
  expect(stack).to(
    haveResource('AWS::CloudFormation::CustomResource', {
      ReadWriteCapacity: 40000,
      DesiredCount: 1000000,
      TableName: 'friends',
    }),
  );
});
