const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region: REGION,
  endpoint: `https://s3.${REGION}.amazonaws.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const AGE_FOLDERS = {
  newborn: 'Newborn',
  toddler: 'Toddler',
  junior:  'Junior',
};

const uploadToS3 = async (file, ageGroup) => {
  const ext    = file.originalname.split('.').pop();
  const folder = AGE_FOLDERS[ageGroup] || 'Other';
  const key    = `products/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket:             BUCKET,
    Key:                key,
    Body:               file.buffer,
    ContentType:        file.mimetype,
    ContentDisposition: 'inline',
  }));
  return `https://s3.${REGION}.amazonaws.com/${BUCKET}/${key}`;
};

const deleteFromS3 = async (url) => {
  try {
    const key = url.includes('.amazonaws.com/')
      ? url.split('.amazonaws.com/').pop().replace(`${BUCKET}/`, '')
      : null;
    if (key) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch { /* ignore */ }
};

module.exports = { s3, uploadToS3, deleteFromS3 };