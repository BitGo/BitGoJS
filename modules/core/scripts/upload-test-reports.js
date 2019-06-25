const path = require('path');
const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');

const {
  reports_s3_akid,
  reports_s3_sak,
  DRONE,
  DRONE_BUILD_NUMBER,
  DRONE_STAGE_NAME,
} = process.env;


if (!DRONE) {
  console.log('Not running in drone, exiting...');
  process.exit(0);
}

const s3 = new S3({
  accessKeyId: reports_s3_akid,
  secretAccessKey: reports_s3_sak,
  signatureVersion: 'v4',
});

const ROOTDIR = path.dirname(path.dirname(require.main.filename));
const MODULE = path.basename(ROOTDIR);
const OBJECT_NAME = `${DRONE_BUILD_NUMBER}/${MODULE}/${DRONE_STAGE_NAME}.html`;
const REPORT_FILE = `${ROOTDIR}/mochawesome-report/mochawesome.html`;

if (!fs.existsSync(REPORT_FILE)) {
  console.warn(`Report file '${REPORT_FILE}' not found. Skipping test report upload...`);
} else {
  const uploadParams = {
    Body: fs.readFileSync(REPORT_FILE),
    Bucket: 'bitgo-sdk-test-reports',
    Key: OBJECT_NAME,
    ACL: 'public-read',
    ContentType: 'text/html',
  };

  s3.putObject(uploadParams, (err, data) => {
    if (err) {
      console.error(`S3 error: ${err}\n${err.stack}`);
    } else {
      console.log(`=== TEST REPORT UPLOADED SUCCESSFULLY ===`);
      console.log(`https://bitgo-sdk-test-reports.s3.amazonaws.com/${OBJECT_NAME}`);
      console.log();
    }
  });
}
