function createChunkBuffer(mb){
  return Buffer.alloc(1024*1024, 'a');
}
module.exports = { createChunkBuffer };
