const aws = require("aws-sdk");
aws.config.update({ region: "us-east-1" });
const stepfunctions = new aws.StepFunctions();

var params = {
  activityArn:
    "arn:aws:states:us-east-1:172597598159:activity:mattw-reinvent2017-createnewpageactivity",
  workerName: "addingPages"
};

stepfunctions.getActivityTask(params, function(err, data) {
  if (err)
    console.log(err, err.stack); // an error occurred
  else console.log(data); // successful response
});
