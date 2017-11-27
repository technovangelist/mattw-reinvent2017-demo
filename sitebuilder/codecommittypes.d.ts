import * as aws from 'aws-sdk';

export interface ICodeCommitEventPayload {
    Records: ICodeCommitRecord[];
}

export interface ICodeCommitCCRef {
    commit: string;
    ref: string;

}
export interface ICodeCommitCCRefObject {
    references: ICodeCommitCCRef[];
}
export interface ICodeCommitRecord {
    eventId: string;
    eventVersion: string;
    eventTime: string;
    eventTriggerName: string;
    eventPartNumber: number;
    codecommit: ICodeCommitCCRefObject;
    eventName: string;
    eventTriggerConfigId: string;
    eventSourceARN: string;
    userIdentityARN: string;
    eventSource: string;
    awsRegion: string;
    eventTotalParts: number;
}
