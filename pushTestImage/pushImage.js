const aws = require("aws-sdk");
const fs = require("fs");

const pushToS3 = () => {
  const s3 = new aws.S3();

    fs.readFile('third.jpg', (err, data)=> {
        if (err) console.log(err);

        let base64data = new Buffer(data, 'binary');
        s3.putObject({
            Bucket: 'mattw-reinvent17-liveblogger-src', 
            Key: Date.now().toString(), 
            Body: base64data, 
            ACL: 'public-read'
        }, resp => {
            console.log(resp);
            console.log('uploaded file');

        })
    })
    // const requestEpoch = event.requestContext.requestTimeEpoch;
    // const buffer = new Buffer(event.body, "base64");
    // const fileMime = fileType(buffer);
    // const file = getFile(fileMime, buffer);
    // file.params.Key = `${requestEpoch}.jpg`;
    // file.params.ACL = "public-read";
    // const objectInfo = await s3.putObject(file.params).promise();

    // let response = {
    //     statusCode: 200,
    //     body: JSON.stringify({
    //     message: "uploaded image to s3",
    //     etag: objectInfo.ETag
    //     })
    // };

};

pushToS3();
