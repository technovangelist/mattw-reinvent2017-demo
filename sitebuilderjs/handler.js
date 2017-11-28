"use strict";

const aws = require("aws-sdk");

module.exports.whatChanged = async (event, context, callback) => {
  const CC = new aws.CodeCommit();
  // const commitId = event.CommitId;
  const repoName = "reinvent2017-website";

  try {
    const commitInfo = await CC.getCommit({
      commitId: event.CommitId,
      repositoryName: repoName
    }).promise();
    const diffInfo = await CC.getDifferences({
      afterCommitSpecifier: event.CommitId,
      repositoryName: repoName,
      beforeCommitSpecifier: commitInfo.commit.parents[0]
    }).promise();

    const hasDocker =
      diffInfo.differences.filter(diff => {
        return diff.beforeBlob.path.match(/(Dockerfile|buildspec.yml|package.json)/);
      }).length > 0;
    callback(null, {
      message: `Verified Commit: ${hasDocker
        ? "Docker Updated"
        : "Docker Not Updated"}`,
      hasDocker: hasDocker,
      commitId: event.CommitId
    });
  } catch (err) {
    callback(err);
  }
};

module.exports.build = async (event, context, callback) => {
  // console.log(JSON.stringify(event));
  // const codeCommitEvent = JSON.parse(event.Records[0].Sns.Message);
  const codebuild = new aws.CodeBuild();
  try {
    const cbparams = {
      projectName: "buildfromdocker",
      sourceVersion: event.commitId
    };

    const buildInfo = await codebuild.startBuild(cbparams).promise();
    notify(`Website publish started: ${timeStamp()}`);
    callback(null, { message: "build maybe worked", buildId: buildInfo.build.id });
  } catch (err) {
    callback(err.message);
  }
};


module.exports.buildDocker = async (event, context, callback) => {
  const codebuild = new aws.CodeBuild();

  try {
    const cbparams = {
      projectName: "buildDockerImage", 
      sourceVersion: event.commitId
    };


    const buildInfo = await codebuild.startBuild(cbparams).promise();
    notify(`Docker image build started ${timeStamp()}`);
    
    callback(null, { message: "did the build docker", commitId: event.commitId, containerBuildId: buildInfo.build.id });
  } catch (err) {
    callback(err.message);
  }
};

module.exports.isTheContainerBuilt = async (event, context, callback) => {
  const cb = new aws.CodeBuild();
  try {
    const params = { ids: [event.containerBuildId] };

    const buildInfo = await cb.batchGetBuilds(params).promise();
    const buildDone = buildInfo.builds[0].buildComplete;
    callback(null, {
      message: `The container has${buildDone?" ":" not "}been built`,
      containerBuildId: event.containerBuildId,
      containerBuildDone: buildDone, 
      commitId: event.commitId
    });
  } catch (err) {
    callback(null, {message: err.message});
  }
};


module.exports.isItBuilt = async (event, context, callback) => {
  const cb = new aws.CodeBuild();
  try {
    
    const params = { ids: [event.buildId] };

    const buildInfo = await cb.batchGetBuilds(params).promise();
    const buildDone = buildInfo.builds[0].buildComplete;
    callback(null, { message: "verified built", buildId: event.buildId, buildDone: buildDone });
  } catch (err) {
    callback(err.message);
  }
};

module.exports.startStepFunction = (event, context, callback) => {
  const stepFunction = new aws.StepFunctions();
  const stateMachineArn = process.env.statemachine_arn;

  const { MessageId, Message } = event.Records[0].Sns;
  const { commit, ref } = JSON.parse(
    Message
  ).Records[0].codecommit.references[0];

  const outobj = { SnsMessageId: MessageId, CommitId: commit, Branch: ref };

  const params = {
    input: JSON.stringify(outobj),
    stateMachineArn: stateMachineArn
  };

  return stepFunction.startExecution(params, (err, data) => {
    if (err) console.log(err, err.stack);
    else console.log(`Step Function started: ${JSON.stringify(data)}`);
  });
  callback(null, { message: `StepFunction ${stateMachineArn} started`, event });
};

module.exports.done = async (event, context, callback) => {
  notify(`Website successfully published: ${timeStamp()}`);

  // const sms = new aws.SNS();
  // const params = {
  //   Message: "Website Successfully Published", 
  //   TopicArn: "arn:aws:sns:us-east-1:172597598159:mattw-notify-siteBuild"
  // }
  // sms.publish(params, (err, data) => {
  //   if (err) console.log(err.message);
  //   else console.log(data);
  // })
}

const timeStamp = () => {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`;
};

const notify = (message) => {
  const sms = new aws.SNS();
   const params = { 
     Message: message, 
     TopicArn: "arn:aws:sns:us-east-1:172597598159:mattw-notify-siteBuild" };
   sms.publish(params, (err, data) => {
     if (err) console.log(err.message);
     else console.log(data);
   });
};


// module.exports.buildDocker = (event, context, callback) => {
//   const codeCommitEvent = JSON.parse(event.Records[0].Sns.Message);
// }
