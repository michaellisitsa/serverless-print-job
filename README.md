# Serverless Print API

Check it out on:

[**https://lisitsa.dev**](https://lisitsa.dev) 💻🌐👨‍💻

Front-end Code: [michaellisitsa/personal-website-aws](https://github.com/michaellisitsa/personal-website-aws)

- [x] Websocket API Gateway for generating motivational posters
- [x] Rest API Gateway for getting random motivational phrases
- [x] S3 storage of generated pdfs

## How to deploy

- Modify `bin/serverless-print-cdk` for your account details
- `cdk deploy`

## Testing

The generatePdf lambda can be tested

```js
cd generatePdf
npm install
npm run invoke "YOUR TEXT HERE"
```
