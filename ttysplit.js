var fs = require('fs');
var fileName = process.argv[2];
var startFrame = process.argv[3];
var endFrame = process.argv[4];
var fd = fs.openSync(fileName, 'r');
var header = Buffer.alloc(12);  // Buffer.alloc() 사용
var closestFrameClear = -1;
var frameNum = 0;
var sec = 0;
var usec = 0;
var len = 0;
var position = 0;  // 파일 위치를 추적하기 위한 변수 추가

while(fs.readSync(fd, header, 0, 12, position) === 12) {
  frameNum++; 
  sec  = (((((header[3] << 8) | header[2]) << 8) | header[1]) << 8) | header[0];
  usec = (((((header[7] << 8) | header[6]) << 8) | header[5]) << 8) | header[4];
  len  = (((((header[11] << 8) | header[10]) << 8) | header[9]) << 8) | header[8];
  var frameBuffer = Buffer.alloc(len);  // Buffer.alloc() 사용
  received = fs.readSync(fd, frameBuffer, 0, len, position + 12);
  if (len != received) {
    console.error('Bad frame header length!');
    process.exit(1);
  }
  if(frameBuffer.toString().indexOf('\x1B[2J') >= 0 && frameNum > closestFrameClear && frameNum < startFrame) {
    closestFrameClear = frameNum;
  }
  position += (12 + len);  // 다음 프레임의 위치로 이동
}

fs.closeSync(fd);
if(!startFrame && !endFrame) {
  console.log(frameNum);
  process.exit(0);
}

fd = fs.openSync(fileName, 'r');
frameNum = 0;
position = 0;  // 위치 초기화

if(closestFrameClear !== -1) {
  startFrame = closestFrameClear;
}

while(fs.readSync(fd, header, 0, 12, position) === 12) {
  frameNum++; 
  sec  = (((((header[3] << 8) | header[2]) << 8) | header[1]) << 8) | header[0];
  usec = (((((header[7] << 8) | header[6]) << 8) | header[5]) << 8) | header[4];
  len  = (((((header[11] << 8) | header[10]) << 8) | header[9]) << 8) | header[8];
  var frameBuffer = Buffer.alloc(len);
  received = fs.readSync(fd, frameBuffer, 0, len, position + 12);
  if (len != received) {
    console.error('Bad frame header length!');
    process.exit(1);
  }
  if((startFrame && frameNum >= startFrame) && (!endFrame || frameNum <= endFrame)) {
    process.stdout.write(header);
    process.stdout.write(frameBuffer);
  }
  position += (12 + len);
}
