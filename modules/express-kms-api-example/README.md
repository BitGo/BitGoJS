# KMS API example (REST API)

Based on TDD specification [On-Prem Wallets(https://docs.google.com/document/d/1ku2agwirV3tHCJF350VF_uaVx73D6vu7yUBaDp-cxL0/edit?tab=t.0#heading=h.165ukudv7ejt)]

Made with ExpressJS, Typescript and sqlite3.

# Installation steps / setup

1 - Clone the BitGoJS repo and navigate in the terminal until you reach this folder (express-kms-api-example)
2 - Set the current node version with node version manager: $nvm use
3 - Install all the packages: $npm install
4 - Create a .env file inside src/ (src/.env)
5 - Edit the .env file and set this couple of variables:

   USER_PROVIDER_CLASS="aws"
   BACKUP_PROVIDER_CLASS="aws"

you could use different class names between user provider and backup provider or the same, it depends on your particular setup.
Important notes: in the /providers folder, you may be able to add your providers (aws, azure, mock, custom, etc), for adding a new custom provider just follow the structure of the AWS one, starting from the root folder:

providers/
|
|-aws/
   |
   |--aws-kms.ts

the "aws" part on "aws-kms" filename is the same as the USER_PROVIDER_CLASS or BACKUP_PROVIDER_CLASS

In the case of aws, in aws-kms.ts you may find the AwsKmsProvider class declared inside the file.
For your custom provider, suppose that the provider is called "custom", you may need this folder structure:

providers/
|
|-custom/
    |
    |--custom-kms.ts

Inside custom-kms.ts ==> class CustomKmsProvider (implements the common interface)

6 - Implement your custom providers if necessary or use the aws/azure implementation included
7 - Run the project(test): $npm run dev

