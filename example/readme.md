# Example implementation
You'll find a complete example implementation of Lulo bundled in this repo.
Clone the source code and follow the instructions below.

## Configuration
In `samconfig.toml`, change:
```
s3_bucket=
s3_prefix=
```
to whatever values you want (or remove this configuration). Note that the configuration must be updated in two places.

In `template.yaml`, replace:
```
{StackName} with the name of the stack you want to describe
{ExampleParameterName} with the name of the parameter value you want to describe
```

## Deployment
Configure your env with AWS Credentials and run:
```
npm run deploy
```
