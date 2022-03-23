const path = require('path');
const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');
const { version } = require('../package.json');
const { promisify } = require('util');

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

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

const ROOTDIR = path.dirname(path.dirname(require.main.filename));
const MODULE = path.basename(ROOTDIR);
const OBJECT_ROOT = `${MODULE}/${version}`;
const DOCS_ROOT = `${ROOTDIR}/docs/`;

async function walk(currentDirPath, seen = []) {
  const files = await readdir(currentDirPath);
  for (const file of files) {
    const filePath = path.join(currentDirPath, file);
    const fileStat = await stat(filePath);
    if (fileStat.isFile()) {
      seen.push({ filePath, stat: fileStat });
    } else if (fileStat.isDirectory()) {
      await walk(filePath, seen);
    }
  }
  return seen;
}

async function upload(uploadParams) {
  try {
    await s3.putObject(uploadParams).promise();
  } catch (e) {
    console.error(`S3 error: ${e}\n${e.stack}`);
    throw e;
  }
}

const contentTypes = {
  js: 'text/javascript',
  css: 'text/css',
  png: 'image/png',
  html: 'text/html',
};

function contentType(filePath) {
  const search = filePath.match(/\.([a-z0-9]+)$/i);

  if (search && search[1] && search[1] in contentTypes) {
    return contentTypes[search[1]];
  }

  return 'text/html';
}

async function uploadDocs(root, key) {
  const uploadPromises = [];
  const now = Date.now();
  const files = await walk(root);
  console.log(`Uploading ${files.length} documentation source files to S3`);
  for (const { filePath } of files) {
    const bucketPath = `${key}/${filePath.replace(DOCS_ROOT, '')}`;
    const uploadParams = {
      Body: await readFile(filePath),
      Bucket: 'bitgo-sdk-docs',
      Key: bucketPath,
      ACL: 'public-read',
      ContentType: contentType(filePath),
    };

    uploadPromises.push(upload(uploadParams));
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
  uploadDocs(DOCS_ROOT, OBJECT_ROOT)
    .catch((e) => console.error('fatal', e, e.stack));
}
