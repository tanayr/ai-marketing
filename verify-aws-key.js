// Simple script to verify AWS keys and format
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// The key as it appears in your .env.local file
const rawSecretKey = 'yelfWaFvWbJ\\/fwixhDDep5DudtJ4f4ypqCGzWbJJK';
console.log('Raw key from .env file:', rawSecretKey);

// Try different string transformations to get the correct format
const variations = [
  // Original with escaped slash
  rawSecretKey,
  
  // Remove backslash escape - option 1
  rawSecretKey.replace(/\\\//g, '/'),
  
  // Remove backslash escape - option 2
  'yelfWaFvWbJ/fwixhDDep5DudtJ4f4ypqCGzWbJJK',
  
  // Option 3 - raw value without any escaping
  rawSecretKey.replace(/\\\\/g, '\\')
];

// Print all variations for verification
variations.forEach((key, index) => {
  console.log(`Variation ${index + 1}:`, key);
  console.log(`Length: ${key.length}`);
  console.log('Characters:');
  for (let i = 0; i < key.length; i++) {
    console.log(`  Pos ${i}: '${key[i]}' (char code: ${key.charCodeAt(i)})`);
  }
  console.log('\n');
});

// Try each variation
async function testVariation(secretKey, index) {
  try {
    console.log(`\nTesting variation ${index}:`);
    console.log('Secret key:', secretKey);
    
    const s3 = new S3Client({
      region: 'us-east-2',
      credentials: {
        accessKeyId: 'AKIA6ALONV7WELTFOD54',
        secretAccessKey: secretKey,
      }
    });
    
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);
    console.log('SUCCESS! Credentials are valid.');
    console.log('Buckets:', response.Buckets.map(b => b.Name).join(', '));
    return true;
  } catch (error) {
    console.error(`FAILED Variation ${index}`);
    console.error('Error Message:', error.message);
    return false;
  }
}

// Run the tests sequentially
async function testAllVariations() {
  for (let i = 0; i < variations.length; i++) {
    await testVariation(variations[i], i + 1);
  }
}

testAllVariations();
