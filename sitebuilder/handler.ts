import * as aws from 'aws-sdk';
import {ICodeCommitEventPayload} from './codecommittypes'
// const codecommit = new aws.CodeCommit();

export const build = (event: ICodeCommitEventPayload, context: any) => {
  // const references = event.Records[0].codecommit.references.map(reference => {return reference.ref} );
  // console.log(`References: ${references}`);

  // const repo = event.Records[0].eventSourceARN.split(":")[5];
  // console.log(`Repo: ${repo}`);
  // const params = { repositoryName: repo };
  // codecommit.getRepository(params, (err, data) => {
  //   if (err) {
  //     console.log(err);
  //     const message = `Error getting repo metadata for repo ${repo}`;
  //     console.log(message);
  //     context.fail(message);
  //   } else {
  //     console.log(data.repositoryMetadata.cloneUrlHttp);
  //     context.succeed(data.repositoryMetadata.cloneUrlHttp);
  //   }

  const codebuild = new aws.CodeBuild();
  const cbparams = {
    projectName: 'buildfromdocker', 
    sourceVersion: event.Records[0].codecommit.references[0].commit
  };

  codebuild.startBuild(cbparams, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  });

};
