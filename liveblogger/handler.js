("use strict");

const aws = require("aws-sdk");
const fileType = require("file-type");
const unirest = require("unirest");
const git = require("simple-git");
const assurancemin = 0.8;
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
      // .post("http://cl-api.vize.ai/3683")
      .post("http://cl-api.vize.ai/3796")
      .attach({ image: s3imagefile })
      .header(
        "Authorization",
        "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjMzNDMsImlhdCI6MTUxMTkwNDk1MywiZXhwIjoxNTE5NjgwOTUzfQ.gbVg20sPP9wdWRDXlJf0sR0BwjMDwwCO_mxLqenAdLk"
      )
      .header("Accept", "application/json")
      .end(function(result) {
        vizeout = result.body;
        let assurance = vizeout.scores[vizeout.prediction];
        console.log(assurance);
        console.log(`slide ${vizeout.prediction} - ${assurance}`);
        callback(null, {
          message: `Slide ${vizeout.prediction}`,
          image: s3imagefile,
          scores: vizeout.scores,
          prediction: vizeout.prediction,
          assurance: assurance
        });
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports.isThisANewSlide = async (event, context, callback) => {
  // update this to point to real current slide

  const dynamo = new aws.DynamoDB();
  try {
    let isNewSlide = true;
    const lastslide = await dynamo
      .getItem({
        Key: { current: { S: "current" } },
        TableName: "livebloggercurrent"
      })
      .promise();
    const prediction = parseInt(event.prediction);
    const assured = event.assurance > assurancemin;
    const knownsameslide = lastslide.Item.slide.N == prediction && assured;
    const knowndifferentslide = lastslide.Item.slide.N != prediction && assured;

    if (knowndifferentslide) {
      console.log("I recognize that this slid is different");
      isNewSlide = true;

      const params = {
        Item: {
          current: { S: "current" },
          slide: { N: prediction.toString() }
        },
        TableName: "livebloggercurrent"
      };
      dynamo.putItem(params, (err, data) => {
        if (err) console.log(`problem setting current slide in dynamo: ${err}`);
        else console.log(`Set current slide in dynamo to ${prediction}`);
      });
    }

    if (knownsameslide) {
      isNewSlide = false;
    }

    callback(null, {
      message: `Site should ${isNewSlide ? " " : "not "}be updated`,
      updateSite: isNewSlide,
      image: event.image,
      slide: event.prediction,
      assurance: event.assurance
    });
  } catch (err) {
    callback(err);
  }
};

module.exports.pullSlideData = async (event, context, callback) => {
  if (event.updateSite) {
    const dynamo = new aws.DynamoDB();
    const params = {
      Key: {
        slideid: {
          N: event.slide
        }
      },
      TableName: "liveblogger"
    };

    dynamo.getItem(params, (err, data) => {
      if (err) console.log(err);
      else {
        console.log(data);
        if (!isEmpty(data)) {
          callback(null, {
            message: `Got text for slide ${event.slide}`,
            image: event.image,
            text: data.Item.text.S,
            slide: event.slide,
            assurance: event.assurance,
            updateSite: true
          });
        } else {
          callback(null, {
            message: "no slide data in dynamo",
            updateSite: true,
            text: "",
            slide: event.slide,
            assurance: event.assurance,
            image: event.image
          });
        }
      }
    });
  } else {
    callback(null, { message: "skipping", updateSite: false });
  }
};

module.exports.createDocument = async (event, context, callback) => {
  let { DateTime } = require("luxon");
  const dynamo = new aws.DynamoDB();
  let vizechance = "";
  let assured = false;
  if (parseFloat(event.assurance) > assurancemin) {
    assured = true;
    vizechance = `*Vize.ai says there is a ${(
      parseFloat(event.assurance) * 100
    ).toString()}% chance this is Slide ${event.slide}*`;
  }
  const postDate = DateTime.local()
    .setZone("America/Los_Angeles")
    .toISO();
  const postTitle = assured
    ? `Slide ${event.slide} Live Blog`
    : "Live Blog Update";

  let slidepost = `---\ndate: ${postDate}\ntitle: ${postTitle}\ntype: liveblog\n---\n![Slide Image](${event.image})<br>${event.text}<br>${vizechance}`;
  console.log(slidepost);
  const buffer = new Buffer(slidepost);
  const params = {
    Body: buffer,
    Bucket: "mattw-reinvent2017-rawsitepages",
    Key: `${DateTime.local()
      .setZone("America/Los_Angeles")
      .toFormat("LL-dd-yy-T")}-slide${event.slide}-liveblog/index.md`
  };
  const s3 = new aws.S3();
  s3.putObject(params, (err, data) => {
    if (err) callback(err);
    else callback(null, { message: "it worked", updateSite: event.updateSite });
  });
};

module.exports.buildSite = async (event, context, callback) => {
  const codebuild = new aws.CodeBuild();
  try {
    const cbparams = {
      projectName: "buildfromdocker",
      sourceVersion: event.commitId
    };

    const buildInfo = await codebuild.startBuild(cbparams).promise();
    notify(`Website publish started: ${timeStamp()}`);
    callback(null, {
      message: "build maybe worked",
      buildId: buildInfo.build.id, 
      updateSite: event.updateSite
    });
  } catch (err) {
    callback(err.message);
  }
};

module.exports.isItBuilt = async (event, context, callback) => {
  const cb = new aws.CodeBuild();
  try {
    const params = { ids: [event.buildId] };

    const buildInfo = await cb.batchGetBuilds(params).promise();
    const buildDone = buildInfo.builds[0].buildComplete;
    callback(null, {
      message: "verified built",
      buildId: event.buildId,
      buildDone: buildDone, 
      updateSite: event.updateSite
    });
  } catch (err) {
    callback(err.message);
  }
};


module.exports.completeSF = async (event, context, callback) => {
  console.log(event.updateSite);
  if (event.updateSite == true) {
    notify(`Website successfully published: ${timeStamp()}`);
  }
};

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

function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) return false;
  }
  return true;
}

const notify = message => {
  const sms = new aws.SNS();
  const params = {
    Message: message,
    TopicArn: "arn:aws:sns:us-east-1:172597598159:mattw-notify-siteBuild"
  };
  sms.publish(params, (err, data) => {
    if (err) console.log(err.message);
    else console.log(data);
  });
};
