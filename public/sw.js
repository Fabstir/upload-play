'use strict';

// ! S5 web proxy service worker
// ! VERSION 9

/* const urlsToCache = ["/", "app.js", "styles.css", "logo.svg"];

caches.open("pwa-assets")
.then(cache => {
  cache.addAll(urlsToCache);
}); */

let wasm;

let cachedUint8Memory0 = new Uint8Array();

function getUint8Memory0() {
  if (cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

let cachedInt32Memory0 = new Int32Array();

function getInt32Memory0() {
  if (cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
/**
 * @param {Uint8Array} input
 * @returns {Uint8Array}
 */
function hash_blake3(input) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
    const ptr0 = passArray8ToWasm0(input, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    wasm.hash_blake3(retptr, ptr0, len0);
    var r0 = getInt32Memory0()[retptr / 4 + 0];
    var r1 = getInt32Memory0()[retptr / 4 + 1];
    var v1 = getArrayU8FromWasm0(r0, r1).slice();
    wasm.__wbindgen_free(r0, r1 * 1);
    return v1;
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16);
  }
}

/**
 * @param {Uint8Array} chunk_bytes
 * @param {bigint} offset
 * @param {Uint8Array} bao_outboard_bytes
 * @param {Uint8Array} blake3_hash
 * @returns {number}
 */
function verify_integrity(
  chunk_bytes,
  offset,
  bao_outboard_bytes,
  blake3_hash
) {
  const ptr0 = passArray8ToWasm0(chunk_bytes, wasm.__wbindgen_malloc);
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passArray8ToWasm0(bao_outboard_bytes, wasm.__wbindgen_malloc);
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passArray8ToWasm0(blake3_hash, wasm.__wbindgen_malloc);
  const len2 = WASM_VECTOR_LEN;
  const ret = wasm.verify_integrity(ptr0, len0, offset, ptr1, len1, ptr2, len2);
  return ret;
}

async function load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            e
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}

function getImports() {
  const imports = {};
  imports.wbg = {};

  return imports;
}

function initMemory(imports, maybe_memory) {}

function finalizeInit(instance, module) {
  wasm = instance.exports;
  init.__wbindgen_wasm_module = module;
  cachedInt32Memory0 = new Int32Array();
  cachedUint8Memory0 = new Uint8Array();

  return wasm;
}

function initSync(module) {
  const imports = getImports();

  initMemory(imports);

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module);
  }

  const instance = new WebAssembly.Instance(module, imports);

  return finalizeInit(instance, module);
}

async function init(input) {
  if (typeof input === 'undefined') {
    input = new URL('rust_lib.wasm', self.location.origin);
  }
  const imports = getImports();

  if (
    typeof input === 'string' ||
    (typeof Request === 'function' && input instanceof Request) ||
    (typeof URL === 'function' && input instanceof URL)
  ) {
    input = fetch(input);
  }

  initMemory(imports);

  const { instance, module } = await load(await input, imports);

  return finalizeInit(instance, module);
}

// ! rust-wasm

let availableDirectoryFiles = {};

let chunkCache = {};

let downloadingChunkLock = {};

function _base64ToUint8Array(base64) {
  var binary_string = atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

/* function decodeEndian(bytes) {
  let total = 0;

  ley

  for (let i = 0; i < bytes.length; i++) {
    total += bytes[i] * pow(256, i) as int;
  }

  return total;
} */

function openRead(df, start, totalSize) {
  return new ReadableStream({
    async start(controller) {
      console.log('using openRead ', start, totalSize);

      let chunk = Math.floor(start / df.file.chunkSize);

      let offset = start % df.file.chunkSize;

      const isSkynetFile = df.file.url.startsWith('sia://');

      const isS5File = df.file.url.startsWith('s5://');

      let url = isS5File
        ? skynetPortal + '/s5/raw/stream/' + df.file.url.substr(5)
        : isSkynetFile
        ? skynetPortal + '/' + df.file.url.substr(6)
        : df.file.url;

      /*   if (isS5File) {
          let response = await fetch(url);
          console.log('response.redirected', response.redirected)
          let data = await response.json();
          console.log('response.redirected', data);
        } */

      const secretKey = _base64ToUint8Array(
        df.file.key.replace(/-/g, '+').replace(/_/g, '/')
      );

      const totalEncSize =
        Math.floor(df.file.size / df.file.chunkSize) *
          (df.file.chunkSize + 16) +
        (df.file.size % df.file.chunkSize) +
        16 +
        df.file.padding;

      console.log('totalEncSize', totalEncSize);

      let downloadedEncData = new Uint8Array();

      let isDone = false;

      let servedBytes = start;

      while (start < totalSize) {
        // console.log('chunkCache', chunkCache);
        let chunkLockKey = df.file.hash + '-' + chunk.toString();

        if (chunkCache[chunkLockKey] === undefined) {
          // console.log('downloadingChunkLock', downloadingChunkLock)
          if (downloadingChunkLock[chunkLockKey] !== undefined) {
            console.log('[chunk] wait ' + chunk);
            // sub?.cancel();
            await downloadingChunkLock[chunkLockKey];
          } else {
            let complete;
            let err;
            const completer = new Promise((onFulfilled, onRejected) => {
              complete = onFulfilled;
              err = onRejected;
            });
            // TODO
            downloadingChunkLock[chunkLockKey] = completer;

            let retryCount = 0;

            while (true) {
              try {
                console.log('[chunk] dl ' + chunk);
                let encChunkSize = df.file.chunkSize + 16;
                let encStartByte = chunk * encChunkSize;

                let end = Math.min(
                  encStartByte + encChunkSize - 1,
                  totalEncSize - 1
                );

                let hasDownloadError = false;

                if (downloadedEncData.length == 0) {
                  console.log('[chunk] send http range request');

                  const res = await fetch(url, {
                    credentials: /* isSkynetFile ? "include" : */ undefined,
                    headers: {
                      range: 'bytes=' + encStartByte + '-',
                    },
                  });

                  let maxMemorySize = 32 * (df.file.chunkSize + 16);

                  const reader = res.body.getReader();

                  function push() {
                    reader.read().then(({ done, value }) => {
                      // ! Stop request when too fast
                      if (downloadedEncData.length > maxMemorySize) {
                        // controller.close();
                        reader.cancel();
                        downloadedEncData = downloadedEncData.slice(
                          0,
                          maxMemorySize
                        );

                        return;
                      }
                      if (done) {
                        isDone = true;
                        return;
                      }
                      let mergedArray = new Uint8Array(
                        downloadedEncData.length + value.length
                      );
                      mergedArray.set(downloadedEncData);
                      mergedArray.set(value, downloadedEncData.length);

                      downloadedEncData = mergedArray;
                      // console.log('addencdata', done, value);

                      push();
                    });
                  }
                  push();

                  // lateFuture =
                  // console.log('continue');
                }
                let isLastChunk = end + 1 === totalEncSize;

                if (isLastChunk) {
                  while (!isDone) {
                    // console.log('loop2', downloadedEncData.length)
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise((r) => setTimeout(r, 10));
                  }
                } else {
                  while (downloadedEncData.length < df.file.chunkSize + 16) {
                    // console.log('loop', downloadedEncData.length, (df.file.chunkSize + 16))
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise((r) => setTimeout(r, 10));
                  }
                }
                // console.log('bytes', bytes);

                let bytes = isLastChunk
                  ? downloadedEncData
                  : downloadedEncData.slice(0, df.file.chunkSize + 16);

                // console.log('bytes', bytes);

                if (isLastChunk) {
                  downloadedEncData = new Uint8Array();
                } else {
                  downloadedEncData = downloadedEncData.slice(
                    df.file.chunkSize + 16
                  );
                }

                function numberToArrayBuffer(value) {
                  const view = new DataView(
                    new ArrayBuffer(sodium.crypto_secretbox_NONCEBYTES)
                  );
                  for (
                    var index = sodium.crypto_secretbox_NONCEBYTES - 1;
                    index >= 0;
                    --index
                  ) {
                    view.setUint8(
                      sodium.crypto_secretbox_NONCEBYTES - 1 - index,
                      value % 256
                    );
                    value = value >> 8;
                  }
                  return view.buffer;
                }

                let nonce = new Uint8Array(numberToArrayBuffer(chunk));

                // console.log(await bytes.arrayBuffer(), nonce, secretKey)

                let r = sodium.crypto_secretbox_open_easy(
                  bytes,
                  nonce,
                  secretKey
                );

                if (isLastChunk) {
                  chunkCache[chunkLockKey] = new Blob([
                    r.slice(0, r.length - df.file.padding),
                  ]);
                } else {
                  chunkCache[chunkLockKey] = new Blob([r]);
                }
                complete();
                break;
              } catch (e) {
                console.error(e);
                retryCount++;
                if (retryCount > 10) {
                  complete();
                  delete downloadingChunkLock[chunkLockKey];
                  throw new Error('Too many retries. ($e)' + e);
                }

                downloadedEncData = new Uint8Array();

                console.error(
                  '[chunk] download error for chunk ' +
                    chunk +
                    ' (try #' +
                    retryCount +
                    ')'
                );
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          }
        } else {
          // sub?.cancel();
        }
        console.log('[chunk] serve ' + chunk);

        const chunkCacheBlob = chunkCache[chunkLockKey];

        start += chunkCacheBlob.size - offset;

        if (start > totalSize) {
          let end = chunkCacheBlob.size - (start - totalSize);
          console.log('[chunk] LIMIT to ' + end);

          // Get the data and send it to the browser via the controller
          controller.enqueue(
            new Uint8Array(
              await chunkCacheBlob.slice(offset, end).arrayBuffer()
            )
          );
          /* yield * chunkCacheFile.openRead(
            offset,
            end,
          ); */
        } else {
          // console.log('just serve', chunkCacheBlob, offset)
          if (offset === 0) {
            // console.log('array2', chunkCacheBlob);
            let array = new Uint8Array(await chunkCacheBlob.arrayBuffer());
            // console.log('array2', array);
            controller.enqueue(array);
          } else {
            controller.enqueue(
              new Uint8Array(await chunkCacheBlob.slice(offset).arrayBuffer())
            );
          }
          // console.log('write success');
          /* yield * chunkCacheFile.openRead(
            offset,
          ); */
        }

        offset = 0;
        // servedBytes+=offset

        chunk++;
      }

      console.log('write done chunk:', chunk, downloadedEncData);

      controller.close();
    },
  });
}

let streamingUrlCache = {};

// returns string array of matching parts
async function getStreamingLocation(hash, types) {
  let val = streamingUrlCache[hash];
  // console.log('val', val);
  if (val !== undefined) {
    return val;
  }

  // TODO Expiry

  console.debug(
    'fetch',
    'https://s5.cx/api/locations/' + hash + '?types=' + types
  );

  const res = await fetch(
    'https://s5.cx/api/locations/' + hash + '?types=' + types
  );
  const parts = (await res.json())['locations'][0]['parts'];

  streamingUrlCache[hash] = parts;

  return parts;
}

async function runCacheCleaner(cache, keys) {
  let additionalKeys = await cache.keys();

  for (const akeyRaw of additionalKeys) {
    const akey = new URL(akeyRaw.url).pathname.substr(1);
    if (!keys.includes(akey)) {
      keys.unshift(akey);
    }
  }

  console.debug('CacheCleaner', 'length', keys.length);

  while (keys.length > 2048) {
    let key = keys.shift();
    cache.delete(key);
    console.debug('CacheCleaner', 'delete', key);
  }

  return;
  /* let size = 0;
  for (const l of Object.values(chunkMemoryCache)) {
    size += 24;
  } */
  // TODO Default limit: 512 MB RAM
  console.log('memory cache size', Object.keys(chunkMemoryCache).length);

  while (chunkMemoryCacheKeys.length > 1024) {
    let key = chunkMemoryCacheKeys.shift();
    delete downloadingChunkLock[key];
    delete chunkMemoryCache[key];
  }
}

// let chunkMemoryCache = {};
// let chunkMemoryCacheKeys = [];
let chunkCacheKeys = [];
let smallFileCacheKeys = [];

let bao_outboard_bytes_cache = {};
/**
 * @param {Uint8Array} buf1
 * @param {Uint8Array} buf2
 */
function equal(buf1, buf2) {
  if (buf1.byteLength != buf2.byteLength) return false;

  for (var i = 0; i != buf1.byteLength; i++) {
    if (buf1[i] != buf2[i]) return false;
  }
  return true;
}

function openPlaintextRead(cid, start, end, totalSize, limit) {
  console.debug('openPlaintextRead', cid, start, end, totalSize, limit);
  // ! totalSize is exclusive

  // cleanCache();

  const cidBytes = _base64ToUint8Array(
    cid.substring(1).replace(/-/g, '+').replace(/_/g, '/')
  );

  // const sizeBytes = cidBytes.slice(34)

  const b3_hash = cidBytes.slice(2, 34);

  // console.log('sizeBytes', sizeBytes);

  return new ReadableStream({
    // TODO pull
    // type: 'bytes',
    async start(controller) {
      // console.log('controller.desiredSize', controller.desiredSize);

      const hash_b64 = btoa(
        String.fromCharCode.apply(null, cidBytes.slice(1, 34))
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/\=/g, '');

      if (totalSize <= 262144) {
        let parts = await getStreamingLocation(hash_b64, '3,5');
        let url = parts[0];

        const s5Cache = await caches.open('s5-small-files');
        console.debug('openPlaintextRead', 'small file');
        // let cachedBytes = chunkMemoryCache[cid];

        let cachedBytes = await s5Cache.match(cid);

        if (cachedBytes !== undefined) {
          // console.log('using blob cache', cachedBytes);

          // let cachedBytes = new Blob();
          const bytes = new Uint8Array(await cachedBytes.arrayBuffer());
          if (start === 0) {
            if (end === bytes.length) {
              controller.enqueue(bytes);
            } else {
              controller.enqueue(bytes.slice(0, end));
            }
          } else {
            controller.enqueue(bytes.slice(start, end));
          }

          controller.close();
          return;
        }

        if (Math.random() < 0.01) {
          runCacheCleaner(s5Cache, smallFileCacheKeys);
        }

        console.debug('fetch', 'small file', url);
        const res = await fetch(url);
        const bytes = new Uint8Array(await res.arrayBuffer());

        const bytes_b3_hash = hash_blake3(bytes);

        const isValid = equal(b3_hash, bytes_b3_hash);

        if (isValid !== true) {
          throw 'File integrity check failed (BLAKE3 with WASM)';
        }

        if (start === 0) {
          if (end === bytes.length) {
            controller.enqueue(bytes);
          } else {
            controller.enqueue(bytes.slice(0, end));
          }
        } else {
          controller.enqueue(bytes.slice(start, end));
        }
        controller.close();

        s5Cache.put(cid, new Response(bytes));

        smallFileCacheKeys.push(cid);

        return;
      }

      let chunkSize = 262144;

      let chunk = Math.floor(start / chunkSize);

      let offset = start % chunkSize;

      let downloadedEncData = new Uint8Array();

      let isDone = false;

      let servedBytes = start;

      let servedChunkCount = 0;

      let s5Cache = await caches.open('s5-large-files');

      let lockedChunks = [];

      if (limit) {
        if (end - start > chunkSize * 64) {
          end = start + chunkSize * 64;
        }
      }

      while (start < end) {
        /* if (limit) {
          servedChunkCount++;
          if (servedChunkCount > (64)) {
            controller.close();
            console.log('openPlaintextRead stop (limit)')
            // TODO Check if empty
            downloadedEncData = new Uint8Array();
            return;
          }
        } */
        // console.log('[debug] main chunk loop');
        // console.log('chunkCache', chunkCache);

        let chunkCacheKey = '0/' + cid + '-' + chunk.toString();

        // let chunkRes = chunkMemoryCache[chunkCacheKey];
        let chunkRes = await s5Cache.match(chunkCacheKey);

        // console.log('[debug] main chunk loop cache entry', chunkRes);

        if (chunkRes !== undefined) {
          console.debug('serve', 'cache', chunk);
          // console.log('cache timing (1)', chunk, new Date().getMilliseconds());

          const bytes = new Uint8Array(await chunkRes.arrayBuffer());

          // console.log('cache timing (2)', chunk, new Date().getMilliseconds());

          if (offset === 0) {
            if (start + bytes.length > end) {
              controller.enqueue(bytes.slice(0, end % chunkSize));
            } else {
              controller.enqueue(bytes);
            }
          } else {
            if (start - offset + bytes.length > end) {
              controller.enqueue(bytes.slice(offset, end % chunkSize));
            } else {
              controller.enqueue(bytes.slice(offset));
            }
          }
          start += bytes.length - offset;
          // console.log('cache timing (3)', chunk, new Date().getMilliseconds());
          // console.log('cache timing (4)', chunk, new Date().getMilliseconds());
        } else {
          const chunkLockKey = '0/' + cid + '-' + chunk.toString();
          // console.log('downloadingChunkLock', downloadingChunkLock)
          if (
            downloadingChunkLock[chunkLockKey] === true &&
            !lockedChunks.includes(chunkLockKey)
          ) {
            console.debug('[chunk] wait for ' + chunk);
            // sub?.cancel();
            while (downloadingChunkLock[chunkLockKey] === true) {
              // TODO Risk for infinite loop, add timeout
              await new Promise((r) => setTimeout(r, 10));
            }

            let chunkRes = await s5Cache.match(chunkCacheKey);

            const bytes = new Uint8Array(await chunkRes.arrayBuffer());

            if (offset === 0) {
              if (start + bytes.length > end) {
                controller.enqueue(bytes.slice(0, end % chunkSize));
              } else {
                controller.enqueue(bytes);
              }
            } else {
              if (start - offset + bytes.length > end) {
                controller.enqueue(bytes.slice(offset, end % chunkSize));
              } else {
                controller.enqueue(bytes.slice(offset));
              }
            }
            start += bytes.length - offset;
          } else {
            // console.log('download timing (1)', chunk, new Date().getMilliseconds());
            let parts = await getStreamingLocation(hash_b64, '5');
            let url = parts[0];

            let baoOutboardBytesUrl;

            if (parts[1] !== undefined) {
              baoOutboardBytesUrl = parts[1];
            } else {
              baoOutboardBytesUrl = parts[0] + '.obao';
            }

            if (Math.random() < 0.1) {
              runCacheCleaner(s5Cache, chunkCacheKeys);
            }

            if (bao_outboard_bytes_cache[baoOutboardBytesUrl] === undefined) {
              // if (bao_outboard_bytes_cache[baoOutboardBytesUrl] === undefined) {

              console.debug('fetch', 'bao', baoOutboardBytesUrl);
              const res = await fetch(baoOutboardBytesUrl);

              bao_outboard_bytes_cache[baoOutboardBytesUrl] = new Uint8Array(
                await res.arrayBuffer()
              );

              /* const meta = bytes.slice(bytes.length - 16)
      
              console.log(meta);
      
              const baoLength = decodeEndian(meta.slice(0, 8));
              // print('baoLength $baoLength');
      
              if ((bytes.length - 16) != baoLength) {
                throw 'Invalid bao length';
              }
      
              const baoBytes = bytes.slice(
                0,
                baoLength,
              ); */

              /* bao_outboard_bytes_cache[baoOutboardBytesUrl] = baoBytes;
            }

            bao_outboard_bytes = bao_outboard_bytes_cache[baoOutboardBytesUrl]; */
            }
            // let complete;
            // let err;
            let chunkBytes;

            // console.log('download timing (2)', chunk, new Date().getMilliseconds());

            function lockChunk(index) {
              const chunkLockKey = '0/' + cid + '-' + index.toString();
              downloadingChunkLock[chunkLockKey] = true;
              lockedChunks.push(chunkLockKey);
            }

            lockChunk(chunk);

            let retryCount = 0;

            while (true) {
              try {
                console.debug('[chunk] download ' + chunk);

                let encStartByte = chunk * chunkSize;

                // let end = Math.min(encStartByte + chunkSize - 1, totalSize - 1);
                /* if (offset === 0) {
                  if ((start + bytes.length) > end) {
                    controller.enqueue(bytes.slice(0, (end % chunkSize)));
                  } else {
                    controller.enqueue(bytes);
                  }
                } else {
                  if (((start - offset) + bytes.length) > end) {
                    controller.enqueue(bytes.slice(offset, (end % chunkSize)));
                  } else {
                    controller.enqueue(bytes.slice(offset));
                  }
                }
                start += bytes.length - offset; */
                let hasDownloadError = false;

                if (downloadedEncData.length == 0) {
                  // TODO: limit range by available cache

                  let rangeHeader;
                  if (end < encStartByte + chunkSize) {
                    if (encStartByte + chunkSize > totalSize) {
                      rangeHeader = 'bytes=' + encStartByte + '-';
                    } else {
                      rangeHeader =
                        'bytes=' +
                        encStartByte +
                        '-' +
                        (encStartByte + chunkSize - 1);
                    }
                  } else {
                    const downloadUntilChunkExclusive =
                      Math.floor(end / chunkSize) + 1;

                    for (
                      let ci = chunk + 1;
                      ci < downloadUntilChunkExclusive;
                      ci++
                    ) {
                      lockChunk(ci);
                    }

                    const length =
                      chunkSize * (downloadUntilChunkExclusive - chunk);

                    if (encStartByte + length > totalSize) {
                      rangeHeader = 'bytes=' + encStartByte + '-';
                    } else {
                      rangeHeader =
                        'bytes=' +
                        encStartByte +
                        '-' +
                        (encStartByte + length - 1);
                    }
                  }
                  // let chunkLockKey = '0/' + cid + '-' + chunk.toString();

                  // console.log('[debug] send http range request', rangeHeader, url);
                  console.debug('fetch', 'range', rangeHeader, url);

                  console.debug(
                    'download timing (3)',
                    chunk,
                    new Date().getMilliseconds()
                  );

                  const res = await fetch(url, {
                    credentials: /* isSkynetFile ? "include" : */ undefined,
                    headers: {
                      range: rangeHeader,
                    },
                  });

                  // console.log('download timing (4)', chunk, new Date().getMilliseconds());

                  // let maxMemorySize = /* Math.min(10, */ 512 * 262144;

                  const reader = res.body.getReader();

                  function push() {
                    reader.read().then(
                      ({ done, value }) => {
                        // ! Stop request when too fast
                        /*   if (downloadedEncData.length > maxMemorySize) {
                            // controller.close();
                            reader.cancel();
  
                            downloadedEncData = downloadedEncData.slice(0, maxMemorySize);
  
                            return;
                          } */
                        if (done) {
                          console.debug('fetch', 'range', 'http reader done');
                          isDone = true;
                          return;
                        }
                        // console.log('[debug] http reader', value.length);
                        let mergedArray = new Uint8Array(
                          downloadedEncData.length + value.length
                        );
                        mergedArray.set(downloadedEncData);
                        mergedArray.set(value, downloadedEncData.length);

                        downloadedEncData = mergedArray;
                        // console.log('addencdata', done, value);

                        push();
                      },
                      () => {
                        hasDownloadError = true;
                      }
                    );
                  }
                  push();

                  // lateFuture =
                  // console.log('continue');
                }
                let isLastChunk = encStartByte + chunkSize > totalSize;

                console.debug(
                  'download timing (5)',
                  chunk,
                  new Date().getMilliseconds()
                );

                if (isLastChunk) {
                  while (downloadedEncData.length < totalSize - encStartByte) {
                    // console.debug('[debug] loop-end', downloadedEncData.length, (totalSize - encStartByte))
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise((r) => setTimeout(r, 10));
                  }
                } else {
                  while (downloadedEncData.length < chunkSize) {
                    // console.debug('[debug] loop', downloadedEncData.length, chunkSize)
                    if (hasDownloadError) throw 'Download HTTP request failed';
                    await new Promise((r) => setTimeout(r, 10));
                  }
                }
                // console.log('bytes', bytes);

                // console.log('bytes', bytes);

                chunkBytes = isLastChunk
                  ? downloadedEncData
                  : downloadedEncData.slice(0, chunkSize);

                // console.log('verify_integrity', chunkBytes, start, end, chunk, totalSize);

                console.debug(
                  'download timing (6)',
                  chunk,
                  new Date().getMilliseconds()
                );

                let integrity_res = verify_integrity(
                  chunkBytes,
                  BigInt(chunk * chunkSize),
                  bao_outboard_bytes_cache[baoOutboardBytesUrl],
                  b3_hash
                );

                // console.log('download timing (7)', chunk, new Date().getMilliseconds());

                // console.log('integrity_res', integrity_res);

                if (integrity_res != 42) {
                  throw 'File integrity check failed (BLAKE3-BAO with WASM)';
                }

                if (isLastChunk) {
                  await s5Cache.put(chunkCacheKey, new Response(chunkBytes));
                  // chunkMemoryCache[chunkCacheKey] = chunkBytes;
                  chunkCacheKeys.push(chunkCacheKey);
                  downloadedEncData = new Uint8Array();
                } else {
                  await s5Cache.put(chunkCacheKey, new Response(chunkBytes));
                  // chunkMemoryCache[chunkCacheKey] = chunkBytes;
                  chunkCacheKeys.push(chunkCacheKey);
                  downloadedEncData = downloadedEncData.slice(chunkSize);
                }

                try {
                  if (offset === 0) {
                    if (start + chunkBytes.length > end) {
                      controller.enqueue(chunkBytes.slice(0, end % chunkSize));
                    } else {
                      controller.enqueue(chunkBytes);
                    }
                  } else {
                    if (start - offset + chunkBytes.length > end) {
                      controller.enqueue(
                        chunkBytes.slice(offset, end % chunkSize)
                      );
                    } else {
                      controller.enqueue(chunkBytes.slice(offset));
                    }
                  }
                } catch (e) {
                  for (const key of lockedChunks) {
                    delete downloadingChunkLock[key];
                  }
                  console.warn(e);
                  if (downloadedEncData.length == 0) {
                    return;
                  }
                }
                start += chunkBytes.length - offset;
                // console.log('download timing (8)', chunk, new Date().getMilliseconds());

                /*   function numberToArrayBuffer(value) {
                    const view = new DataView(new ArrayBuffer(sodium.crypto_secretbox_NONCEBYTES))
                    for (var index = (sodium.crypto_secretbox_NONCEBYTES - 1); index >= 0; --index) {
                      view.setUint8(sodium.crypto_secretbox_NONCEBYTES - 1 - index, value % 256)
                      value = value >> 8;
                    }
                    return view.buffer
                  } */

                // let nonce = new Uint8Array(numberToArrayBuffer(chunk));

                // console.log(await bytes.arrayBuffer(), nonce, secretKey)

                // let r = sodium.crypto_secretbox_open_easy(bytes, nonce, secretKey);

                // TODO s5Cache.put(chunkCacheKey, new Response(bytes))

                // chunkCache[chunkLockKey] = new Blob([bytes]);

                /* if (isLastChunk) {
                  chunkCache[chunkLockKey] =
                    new Blob([r.slice(
                      0,
                      r.length - df.file.padding,
                    )]);
                } else {
                  chunkCache[chunkLockKey] = new Blob([r]);
                } */

                delete downloadingChunkLock[chunkCacheKey];
                // complete();
                break;
              } catch (e) {
                console.error(e);
                retryCount++;
                if (retryCount > 10) {
                  complete();
                  for (const key of lockedChunks) {
                    delete downloadingChunkLock[key];
                  }
                  throw new Error('Too many retries. ($e)' + e);
                }

                downloadedEncData = new Uint8Array();

                console.error(
                  '[chunk] download error for chunk ' +
                    chunk +
                    ' (try #' +
                    retryCount +
                    ')'
                );
                await new Promise((r) => setTimeout(r, 1000));
              }
            }
          }
        }
        offset = 0;

        chunk++;
      }

      // console.log('[debug] write done chunk:', chunk, downloadedEncData);

      controller.close();
    },
  });
}

function decodeBase64(base64String) {
  var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  var rawData = atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function decodeEndian(bytes) {
  let total = 0;

  for (let i = 0; i < bytes.length; i++) {
    total += bytes[i] * Math.pow(256, i);
  }

  return total;
}

async function respond(url, req) {
  if (url.pathname.startsWith('/s5/blob/')) {
    if (wasm === undefined) {
      await init();
    }

    const fullCID = url.pathname.substr(9);

    const cid = fullCID.split('.')[0];
    // const extension = fullCID.split('.')[1]

    if (!cid.startsWith('u')) {
      throw 'Invalid CID format';
    }

    // console.log('cid', cid);
    let bytes = decodeBase64(cid.substr(1));
    // console.log(bytes);

    let totalSize = decodeEndian(bytes.subarray(34));
    // console.log(totalSize);
    const urlParams = new URLSearchParams(url.search);

    const mediaType = urlParams.get('mediaType') || 'text/plain';

    let contentDisposition = 'inline';

    if (urlParams.get('filename')) {
      contentDisposition =
        'attachment; filename="' + urlParams.get('filename') + '"';
    }

    const resOpt = {
      headers: {
        'Content-Type': mediaType,
        'Content-Disposition': contentDisposition,
      },
    };

    resOpt.headers['accept-ranges'] = 'bytes';
    // resOpt.headers['etag'] = fullCID;

    var start = 0;
    var end = totalSize;

    const range = req.headers.get('range');

    if (range) {
      const m = range.match(/bytes=(\d+)-(\d*)/);
      if (m) {
        const size = totalSize;
        start = +m[1];
        if (m[2]) {
          end = +m[2] + 1;
        } else {
          end = size;
        }

        resOpt.status = 206;
        resOpt.headers['content-range'] = `bytes ${start}-${end - 1}/${size}`;
      }
    }

    resOpt.headers['content-length'] = end - start;

    return new Response(
      openPlaintextRead(
        cid,
        start,
        end,
        totalSize,
        mediaType.startsWith('video/')
      ),
      resOpt
    );
  }
  return;

  let directoryFile = availableDirectoryFiles[url.pathname];

  const resOpt = {
    headers: {
      'Content-Type': directoryFile.mimeType || 'text/plain',
    },
  };

  var start = 0;
  var totalSize = directoryFile.file.size;

  const range = req.headers.get('range');

  if (range) {
    const m = range.match(/bytes=(\d+)-(\d*)/);
    if (m) {
      const size = directoryFile.file.size;
      const begin = +m[1];
      const end = +m[2] || size;

      start = begin;
      totalSize = end;

      resOpt.status = 206;
      resOpt.headers['content-range'] = `bytes ${begin}-${end - 1}/${size}`;
    }
  }

  resOpt.headers['content-length'] =
    directoryFile.file.size - start - (directoryFile.file.size - totalSize);
  return new Response(openRead(directoryFile, start, totalSize), resOpt);
}

onfetch = (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) {
    return;
  }

  if (url.pathname.startsWith('/s5/blob/')) {
    // console.log('pathname', url.pathname);
    e.respondWith(respond(url, req));

    return;
  }
  return;

  /*  if (availableDirectoryFiles[url.pathname] === undefined) {
     return
   }
 
   if (url.pathname.startsWith('__skyfs_internal_EWhqPkTLE2L3jv_')) {
     return
   }
 
   console.log('pathname', url.pathname);
 
   e.respondWith(respond(url, req)) */
};

onmessage = (e) => {
  console.log('onmessage', e);

  const path = e.data['path'];
  const directoryFile = e.data['file'];

  if (e.data['ciphertext'] !== undefined) {
    console.log(e.data);

    const secretKey = _base64ToUint8Array(
      e.data['key'].replace(/-/g, '+').replace(/_/g, '/')
    );

    const ciphertext = _base64ToUint8Array(
      e.data['ciphertext'].replace(/-/g, '+').replace(/_/g, '/')
    );

    let bytes = sodium.crypto_secretbox_open_easy(
      ciphertext,
      new Uint8Array(24),
      secretKey
    );

    console.log(bytes);
    availableDirectoryFiles = JSON.parse(new TextDecoder().decode(bytes));
    availableDirectoryFiles['/'] = availableDirectoryFiles['/index.html'];
    availableDirectoryFiles[''] = availableDirectoryFiles['/index.html'];

    e.source.postMessage({ success: true });
  } else {
    if (availableDirectoryFiles[path] === undefined) {
      availableDirectoryFiles[path] = directoryFile;
      e.source.postMessage({ success: true });
    }
  }
};

onactivate = () => {
  clients.claim();
};
