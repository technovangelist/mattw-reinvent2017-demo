This is a collection of Lambdas, Step Functions, and utilities for the demo run by Matt Williams in his presentation at re:Invent 2017. You can see a video of the session and demo at : https://www.youtube.com/watch?v=Gr2TH277EdA

Directories

* **liveblogger** - Step Function that responds to images posted every 30 seconds from a Raspberry Pi Zero taking images of my slides
* **pushTestImaeg** - Utility to send a test image to the s3 bucket to initiate a test state machine.
* **sitebuilderjs** - Step Function to build the GatsbyJS website and/or the Docker container used by CodeBuild to build Gatsby.
* **slideimageprep** - Utility to take images of each slide and generate many copies of each for uploading to Vize.ai
* **slidenotes** - Utility to take notes on each slide and post them to DynamoDB.