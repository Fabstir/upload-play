/*
 * s5-upload-large-file.mjs
 *
 * The file reads a video file from the specified path,computes its BLAKE3 hash,
 * and uploads it to a remote server using the TUS protocol. The TUS upload endpoint
 * URL and authentication token are obtained from environment variables.
 */

import { Blake3Hasher } from '@napi-rs/blake-hash';
import * as tus from 'tus-js-client';
import * as fs from 'fs';

import dotenv from 'dotenv';
dotenv.config();

export async function uploadVideo(path) {
  const mhashBlake3Default = 0x1f;
  const cidTypeRaw = 0x26;

  const b3hash = await new Promise((resolve, reject) => {
    const hasher = new Blake3Hasher();
    const stream = fs.createReadStream(path);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hasher.update(chunk));
    stream.on('end', () => resolve(hasher.digestBuffer()));
  });

  console.log('BLAKE3 hash', b3hash.toString('hex'));

  const hash = Buffer.concat([Buffer.alloc(1, mhashBlake3Default), b3hash]);

  const cid = Buffer.concat([
    Buffer.alloc(1, cidTypeRaw),
    hash,
    numberToBuffer(fs.statSync(path).size),
  ]);

  const file = fs.createReadStream(path);

  function numberToBuffer(value) {
    const view = Buffer.alloc(16);
    let lastIndex = 15;
    for (var index = 0; index <= 15; ++index) {
      if (value % 256 !== 0) {
        lastIndex = index;
      }
      view[index] = value % 256;
      value = value >> 8;
    }
    return view.subarray(0, lastIndex + 1);
  }

  // Include bearer authentication token in header
  const options = {
    endpoint: process.env.PORTAL_URL + '/s5/upload/tus',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN}`,
    },
    metadata: {
      hash: hash.toString('base64url'),
    },
    onError(error) {
      console.error('An error occurred:');
      console.error(error);
      process.exitCode = 1;
    },
    onProgress(bytesUploaded, bytesTotal) {
      const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
      console.log(bytesUploaded, bytesTotal, `${percentage}%`);
    },
    onSuccess() {
      console.log('Upload finished.');
    },
  };

  const upload = new tus.Upload(file, options);
  upload.start();

  return 'u' + cid.toString('base64url');
}
