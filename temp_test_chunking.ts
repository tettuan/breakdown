import { FileSystem } from './scripts/local_ci/file_system.ts';

const allTestFiles = await FileSystem.findTestFiles(['lib', 'tests']);
console.log('Total test files found:', allTestFiles.length);
console.log('First 10 files:', allTestFiles.slice(0, 10));

// Test chunking with different batch sizes
const batchSize3 = FileSystem.chunk(allTestFiles, 3);
console.log('\nWith batch-size 3:');
console.log('Number of batches:', batchSize3.length);
console.log('First batch:', batchSize3[0]);
console.log('Second batch:', batchSize3[1]);
console.log('Last batch:', batchSize3[batchSize3.length - 1]);

const batchSize10 = FileSystem.chunk(allTestFiles, 10);
console.log('\nWith batch-size 10:');
console.log('Number of batches:', batchSize10.length);
console.log('First batch files count:', batchSize10[0].length);
console.log('Last batch files count:', batchSize10[batchSize10.length - 1].length);
