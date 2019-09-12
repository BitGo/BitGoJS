const path = require('path');
const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');

const {
  reports_s3_akid,
  reports_s3_sak,
  DRONE,
  DRONE_TAG,
  DRONE_STAGE_STATUS,
} = process.env;

if (!DRONE) {
  console.log('Not running in drone, exiting...');
  process.exit(0);
}

if (!DRONE_TAG) {
  console.log('Not a tag build, exiting...');
  process.exit(0);
}

if (DRONE_STAGE_STATUS !== 'success') {
  console.log('Drone pipeline is failed, exiting...');
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

async function readdir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

async function walk(currentDirPath, seen = []) {
  const files = await readdir(currentDirPath);
  for (const file of files) {
    const filePath = path.join(currentDirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      seen.push({ filePath, stat });
    } else if (stat.isDirectory()) {
      await walk(filePath, seen);
    }
  }
  return seen;
}

async function uploadDocs(root, key) {
  const uploadPromises = [];
  const now = Date.now();
  const files = await walk(root);
  console.log(`Uploading ${files.length} documentation source files to S3`);
  for (const { filePath } of files) {
    const bucketPath = `${key}/${filePath.replace(DOCS_ROOT, '')}`;
    const uploadParams = {
      Body: fs.readFileSync(filePath),
      Bucket: 'bitgo-sdk-docs',
      Key: bucketPath,
      ACL: 'public-read',
      ContentType: 'text/html',
    };

    uploadPromises.push(new Promise((resolve, reject) => {
      s3.putObject(uploadParams, (err, data) => {
        if (err) {
          console.error(`S3 error: ${err}\n${err.stack}`);
          reject(err);
        } else {
          process.stdout.write('.');
          resolve();
        }
      });
    }));
  }

  await Promise.all(uploadPromises);
  console.log();
  console.log(`=== DOCS UPLOADED SUCCESSFULLY (${Date.now() - now} ms) ===`);
  console.log(`https://bitgo-sdk-docs.s3.amazonaws.com/${key}/index.html`);
  console.log();
}

if (!fs.existsSync(DOCS_ROOT) || !fs.statSync(DOCS_ROOT).isDirectory()) {
  console.warn(`Docs directory '${DOCS_ROOT}' not found. Skipping docs upload...`);
} else {
  uploadDocs(DOCS_ROOT, OBJECT_ROOT);
}
