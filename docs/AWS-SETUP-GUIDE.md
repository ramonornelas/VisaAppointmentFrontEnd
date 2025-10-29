# AWS Secrets Manager Setup Guide

## 1. Create the Secret in AWS Console

1. Go to AWS Secrets Manager in your AWS Console
2. Click "Store a new secret"
3. Choose "Other type of secret"
4. Add the following key-value pairs:

```json
{
  "clientId": "your-paypal-client-id-here",
  "clientSecret": "your-paypal-client-secret-here",
  "environment": "sandbox"
}
```

5. Name the secret: `paypal-credentials`
6. Add description: "PayPal API credentials for FastVisa application"

## 2. IAM Policy for your application

Create an IAM role/user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GetPayPalSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:*:*:secret:paypal-credentials*"
      ]
    }
  ]
}
```

## 3. Environment Variables for your backend

Add these to your backend environment:

```bash
AWS_REGION=us-west-2
PAYPAL_SECRET_NAME=paypal-credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 4. For production, use different secrets:

- Create: `paypal-credentials-prod`
- Use environment variable to switch: `PAYPAL_SECRET_NAME=paypal-credentials-prod`

## 5. Install AWS SDK in your backend:

```bash
npm install aws-sdk
```

## 6. Optional: Use AWS CLI to create secret

```bash
aws secretsmanager create-secret \
    --name paypal-credentials \
    --description "PayPal API credentials for FastVisa" \
    --secret-string '{
        "clientId": "your-paypal-client-id",
        "clientSecret": "your-paypal-client-secret", 
        "environment": "sandbox"
    }'
```

## 7. Test the setup:

```bash
aws secretsmanager get-secret-value --secret-id paypal-credentials
```
