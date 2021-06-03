import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as neptune from '@aws-cdk/aws-neptune';


export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);




    //APPSYNC's API gives you a graphqlApi with apiKey ( for deploying APPSYNC )
    const api = new appsync.GraphqlApi(this, 'graphlApi', {
      name: 'dinningbyfriends-api',
      schema: appsync.Schema.fromAsset('graphql/schema.gql'),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY
        }
      }
    });




    //creating VirtualPrivateCloud
    const vpc = new ec2.Vpc(this, 'dinningbyfriends-vpc');




    //creating lambdalayer
    const lambdaLayer = new lambda.LayerVersion(this, 'lambdaLayer', {
      code: lambda.Code.fromAsset('lambda-layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X]
    });
    //creating lambdafunction
    const userLambda = new lambda.Function(this, 'dinningbyfriends-userLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode("lambda/User"),
      handler: 'index.handler',
      //giving layers
      layers: [lambdaLayer],
      //giving VPC
      vpc: vpc
    });
    const restaurantLambda = new lambda.Function(this, 'dinningbyfriends-restaurantLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode("lambda/Restaurant"),
      handler: 'index.handler',
      //giving layers
      layers: [lambdaLayer],
      //giving VPC
      vpc: vpc
    });




    //setting lambdafunction ( as a datasource of endpoint )
    const userLambda_datasource = api.addLambdaDataSource('userLamdaDataSource', userLambda);
    const restaurantLambda_datasource = api.addLambdaDataSource('restaurantLamdaDataSource', restaurantLambda);



    
    //describing resolver for datasource
    userLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "createUser"
    });
    userLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "deleteUser"
    });
    userLambda_datasource.createResolver({
      typeName: "Query",
      fieldName: "allUsers"
    });
    //describing resolver for datasource
    restaurantLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "createRestaurant"
    });
    restaurantLambda_datasource.createResolver({
      typeName: "Mutation",
      fieldName: "deleteRestaurant"
    });
    restaurantLambda_datasource.createResolver({
      typeName: "Query",
      fieldName: "allRestaurants"
    });




//**************************NEPTUNE**************************/
    //creating NEPTUNE database cluster
    const cluster = new neptune.DatabaseCluster(this, 'dinningbyfriends-database', {
      vpc: vpc,
      instanceType: neptune.InstanceType.R5_LARGE
    });


    //to control who can access the cluster
    //( any conection in this VPC can access NEPTUNE database cluster, so lambdafunction in VPC can use it )
    cluster.connections.allowDefaultPortFromAnyIpv4('Open to the world');
  

    //endpoints for write access NEPTUNE database cluster 
    const writeAddress = cluster.clusterEndpoint.socketAddress;
    //endpoints for read access NEPTUNE database cluster 
    const readAddress = cluster.clusterReadEndpoint.socketAddress;
//**************************NEPTUNE**************************/




    //adding env to lambdafunction
    userLambda.addEnvironment('WRITE_ADDRESS', writeAddress);
    userLambda.addEnvironment('READ_ADDRESS', readAddress);
    //adding env to lambdafunction
    restaurantLambda.addEnvironment('WRITE_ADDRESS', writeAddress);
    restaurantLambda.addEnvironment('READ_ADDRESS', readAddress);
  }
}