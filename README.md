
# Setting up
1. Install the Serverless Framework: `npm i -g serverless`

2. Install dependencies: `npm i`

3. Ensure you have a Google service account with the following roles:
  - 

# Deploying
To deploy a fresh instance, 


Normally to update an already deployed serverless function, you run `serverless deploy`. But the Google Cloud Functions provider seems to be buggy, so I've found that what works is deleting the function and creating it afresh:

```
serverless remove; serverless deploy
```