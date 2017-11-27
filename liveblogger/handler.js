("use strict");

const aws = require("aws-sdk");
const fileType = require("file-type");
const unirest = require("unirest");
const git = require("simple-git");
const execute = require('lambduh-execute');

// const fs = require("nano-fs");
// const rp = require("request-promise-native");
// const request = require("request");

module.exports.uploadToS3 = async (event, context, callback) => {
  //   console.log(event);

  const s3 = new aws.S3();
  try {
    const requestEpoch = event.requestContext.requestTimeEpoch;
    const buffer = new Buffer(event.body, "base64");
    const fileMime = fileType(buffer);
    const file = getFile(fileMime, buffer);
    file.params.Key = `${requestEpoch}.jpg`;
    file.params.ACL = "public-read";
    const objectInfo = await s3.putObject(file.params).promise();

    let response = {
      statusCode: 200,
      body: JSON.stringify({
        message: "uploaded image to s3",
        etag: objectInfo.ETag
      })
    };
    callback(null, response);
  } catch (error) {
    callback(error);
  }
};

module.exports.startStepFunction = (event, context, callback) => {
  const stepFunction = new aws.StepFunctions();
  const stateMachineArn = process.env.statemachine_arn;
  console.log(JSON.stringify(event));

  const { name: bucketname, arn: bucketarn } = event.Records[0].s3.bucket;
  const { key: filename } = event.Records[0].s3.object;

  const outobj = { bucketname, bucketarn, filename };

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

module.exports.whichSlide = async (event, context, callback) => {
  const s3 = new aws.S3();
  let vizeout = {};
  const s3imagefile =
    "https://s3.amazonaws.com/mattw-reinvent17-liveblogger-src/" +
    event.filename;
  try {
    unirest
      .post("http://cl-api.vize.ai/3683")
      .attach({
        image: s3imagefile
      })
      .header(
        "Authorization",
        "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjMzNDMsImlhdCI6MTUxMTQ4NjE3NywiZXhwIjoxNTE5MjYyMTc3fQ.FBVj5P29Wy7HQA6QgUSSV0ew5XbwcQiMb6SC3C8zXJk"
      )
      .header("Accept", "application/json")
      .end(function(result) {
        vizeout = result.body;
        callback(null, {
          message: `Slide ${vizeout.prediction}`,
          image: s3imagefile,
          scores: vizeout.scores,
          prediction: vizeout.prediction
        });
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports.isThisANewSlide = async (event, context, callback) => {
  // update this to point to real current slide
  const currentSlide = 2;
  const prediction = parseInt(event.prediction);
  let isNewSlide = false;
  if (
    parseInt(prediction) >= currentSlide - 3 &&
    parseInt(prediction) <= currentSlide + 3 &&
    parseInt(prediction) != currentSlide
  ) {
    isNewSlide = true;
  }
  callback(null, {
    message: `Site should ${isNewSlide ? " " : "not "}be updated`,
    updateSite: isNewSlide, 
    image: event.image, 
    slide: event.prediction
  });
};

module.exports.pullSlideData = async (event, context, callback) => {
  const dynamo = new aws.DynamoDB();
  const params = {
    Key: {
      "slideid": {
        N: event.slide
      }
    }, 
    TableName: "liveblogger"
  };

  dynamo.getItem(params, (err, data) => {
    if (err) console.log(err);
    else {
      console.log(data.Item.text.S);
      callback(null, {message: `Got text for slide ${event.slide}`, image: event.image, text: data.Item.text.S, slide: event.slide});
    }
  })

};

module.exports.createDocument = async (event, context, callback) => {
  require("lambda-git")();
  const codecommit = new aws.CodeCommit();
  let result = {};
  execute(result, {shell: "echo `ls /tmp/`", logOutput:true}).then(result => {
    context.done();
  });

  
  const repo = "https://git-codecommit.us-east-1.amazonaws.com/v1/repos/reinvent2017-website";
  git().exec(()=> console.log('start pull')).clone(repo, (err, data) => {
    console.log(data);
  })
};

module.exports.completeSF = async (event, context, callback) => {};

const getFile = (fileMime, buffer) => {
  const fileExt = fileMime.ext;
  const filename = `${timeStamp()}.${fileExt}`;

  const params = {
    Bucket: process.env.s3srcbucket,
    Key: filename,
    Body: buffer
  };

  const uploadFile = {
    size: buffer.toString("ascii").length,
    type: fileMime.mime,
    name: filename,
    full_path: `${params.Bucket}/${filename}`
  };

  return {
    params: params,
    uploadFile: uploadFile
  };
};

const timeStamp = () => {
  const now = new Date();
  return `${now.getMonth() +
    1}/${now.getDate()}/${now.getFullYear()} - ${now.getHours()}:${now.getMinutes()}`;
};
