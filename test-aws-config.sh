#!/bin/bash
# Temporary AWS credentials test script
export AWS_ACCESS_KEY_ID=AKIA6ALONV7WELTFOD54
export AWS_SECRET_ACCESS_KEY='yelfWaFvWbJ/fwixhDDep5DudtJ4f4ypqCGzWbJJK'
export AWS_DEFAULT_REGION=us-east-2

echo "Testing AWS credentials with AWS CLI..."
aws s3 ls

echo "Testing S3 bucket access..."
aws s3 ls s3://marketingwithai42

echo "Done testing."
