const path = require('path');
const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');

const {
  reports_s3_akid,
  reports_s3_sak,
  DRONE,
  DRONE_TAG,
} = process.env;

if (!DRONE) {
  console.log('Not running in drone, exiting...');
  process.exit(0);
}

if (!DRONE_TAG) {
  console.log('Not a tag build, exiting...');
  process.exit(0);
}

const s3 = new S3({
  accessKeyId: reports_s3_akid,
  secretAccessKey: reports_s3_sak,
  signatureVersion: 'v4',
});

const ROOTDIR = path.dirname(path.dirname(require.main.filename));
const MODULE = path.basename(ROOTDIR);
const OBJECT_ROOT = `${MODULE}/${DRONE_TAG}`;
const DOCS_ROOT = `${ROOTDIR}/docs/`;

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach((name) => {
    const filePath = path.join(currentDirPath, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

function uploadDocs(root, key) {
  walkSync(root, (filePath) => {
    const bucketPath = `${key}/${filePath.replace(DOCS_ROOT, '')}`;
    const uploadParams = {
      Body: fs.readFileSync(filePath),
      Bucket: 'bitgo-sdk-docs',
      Key: bucketPath,
      ACL: 'public-read',
      ContentType: 'text/html',
    };

    return s3.putObject(uploadParams, (err, data) => {
      if (err) {
        console.error(`S3 error: ${err}\n${err.stack}`);
      }
    });
  });
  console.log(`=== DOCS UPLOADED SUCCESSFULLY ===`);
  console.log(`https://bitgo-sdk-docs.s3.amazonaws.com/${key}`);
  console.log();
}

if (!fs.existsSync(DOCS_ROOT) || !fs.statSync(DOCS_ROOT).isDirectory()) {
  console.warn(`Docs directory '${DOCS_ROOT}' not found. Skipping docs upload...`);
} else {
  uploadDocs(DOCS_ROOT, OBJECT_ROOT);
}
