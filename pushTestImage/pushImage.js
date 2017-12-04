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
};

pushToS3();
