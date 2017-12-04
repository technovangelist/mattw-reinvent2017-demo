# sitebuilderjs Overview

Step Function to rebuild Gatsby web site as well as the Docker image used by CodeBuild to build gatsby

## whatChanged

Interogates the CodeCommit repo to figure out if the last commit was related to Docker or not

## build

Initiates a CodeBuild build of the GatsbyJS website

## buildDocker

Initiates a CodeBuild built of the Docker image used by CodeBuild to build the GatsbyJS website.

##isTheContainerBuilt

Check if the Docker Image build is done

## isItBuilt

Check if GatsbyJS is finished building

## startStepFunction

Waits for an SNS message to trigger the Step Function to run

