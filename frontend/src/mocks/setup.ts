/**
 * MSW 서버 설정
 */

// TextEncoder/TextDecoder polyfill for Node.js (MSW가 필요로 함)
// 반드시 MSW import보다 먼저 실행되어야 함
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// MSW를 lazy load로 변경하여 polyfill이 먼저 설정되도록 함
import { handlers } from './handlers';

let server: any = null;

export const getServer = () => {
  if (!server) {
    // 동적 import를 사용하여 MSW를 로드
    const { setupServer } = require('msw/node');
    server = setupServer(...handlers);
  }
  return server;
};

