const aws = require('aws-sdk');
aws.config.update({region: 'us-east-1'});
const dynamo = new aws.DynamoDB();
const fs = require('mz/fs');
const readSource = (slidenum) => {
    const slidefilename = slidenum.toString().padStart(2, "0") + ".md";
    fs.exists(slidefilename).then(exists => {
        if (exists) {
            fs.readFile(slidefilename, 'utf8').then(data => {
                pushToDynamo(slidenum, data);
            })
        }
    })
};

const pushToDynamo = (slidenum, text) => {
    const params = {
        Item: {
            "slideid": {
                N: slidenum.toString()
            }, 
            "text": {
                S: text
            }
        }, 
        TableName: "liveblogger"
    };

    const dynamoitem = dynamo.putItem(params).promise();

    dynamoitem.then(data => {
        console.log(`set up slide ${slidenum.toString()}`);
    }).catch(err => {
        console.log(err);
    })
};

for (let index = 1; index < 69; index++) {
    readSource(index);
}