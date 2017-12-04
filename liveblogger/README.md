# LiveBlogger Overview 
LiveBlogger is a an automated live blogger utility that posts data about slides currently showing on the screen. It uses AWS Step Functions and AWS Lambda. 

# Raspberry Pi 
This does not include code used by the Raspberry Pi Zero. For that, refer to: https://github.com/geerlingguy/pi-timelapse. This script was modified by adding logic to push each image to AWS S3 every 30 seconds


# Lambda Functions

## uploadToS3

Standalone Lambda that responds to an API Gateway POST from the Raspberry Pi. Pushes the image sent to the S3 bucket.

## startStepFunction

Standalone Lambda that responds to an S3 PUT event. Collects the State Machine ARN from the environment variables. Starts the State Machine/Step Function.

## whichSlide

Gets the slide image from S3 and submits it to the Vize.ai API for evaluation against the collection of images uploaded before. Waits for a response that includes the prediction of which slide in my deck the image is.

## isThisANewSlide

Each time this is a new slide, the current slide number is stored in a DynamoDB table called livebloggercurrent. Get that number and compare it to the current number. If different, store the new number and return that this is a new slide. 

## pullSlideData

Now that the system knows the slide number and knows that it is a new slide, get information about that slide from my notes stored in DynamoDB.

## createDocument

Generate a Markdown file based on the info pulled from Dynamo about the current slide.

## buildSite

Initiate a build on CodeBuild of my Gatsby website. 

## isItBuilt

Check if the build is complete. This runs every 20 seconds but the build should take about 90 seconds.

## completeSF

Send a notification via SMS on SNS to Matt's iPhone. 

## lrbreset.js
Resets the current slide table in Dynamo to 0
