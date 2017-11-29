const aws = require('aws-sdk');

aws.config.update({region: 'us-east-1'});
const dynamo = new aws.DynamoDB();
let slidenum = process.argv[2] ===undefined?"0":process.argv[2]

const params = {
    Item: {
        "current": {
            S: "current"
        }, 
        "slide": {
            N: slidenum
        }
    }, TableName: "livebloggercurrent"
};


dynamo.putItem(params, (err, data) => {
    if (err) console.log(err);
    else console.log(`reset to ${slidenum}`);

})