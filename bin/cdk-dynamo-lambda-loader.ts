#!/usr/bin/env node
import 'source-map-support/register';

import { App } from '@aws-cdk/core';

import { CdkDynamoLambdaLoaderStack } from '../src/cdk-dynamo-lambda-loader-stack';

const app = new App();
new CdkDynamoLambdaLoaderStack(app, 'CdkDynamoLambdaLoaderStack');
