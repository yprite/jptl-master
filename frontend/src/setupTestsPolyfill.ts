// TextEncoder/TextDecoder polyfill for Node.js (MSW가 필요로 함)
// 이 파일은 setupTests.ts보다 먼저 로드되어야 함
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

