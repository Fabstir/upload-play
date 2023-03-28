/*
 * index.mjs
 *
 * This file contains code for uploading a video file using the TUS protocol and then using gRPC
 * to call a service to transcode the video file to 1080p and 720p h264 formats. Then uploads
 * transcoded files to SIA storage that can then be played from the front end.
 * Noted that this is a test and some dynamic data may be hardcoded.
 *
 * Author: Jules Lai
 * Date: March 1, 2023
 */

export let videoCID = '';
export let videoCID1 = '';
export let videoCID2 = '';

import { Blake3Hasher } from '@napi-rs/blake-hash';
import * as tus from 'tus-js-client';
import fs from 'fs';
import fetch from 'node-fetch';

import { loadPackageDefinition, credentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

import { uploadVideo } from './src/s5-upload-large-file.mjs';

import dotenv from 'dotenv';
dotenv.config();

// Load the proto file
const PROTO_PATH = './transcode.proto';
const packageDefinition = loadSync(PROTO_PATH);
const transcodeProto = loadPackageDefinition(packageDefinition).transcode;

import express from 'express';

const app = express();
app.use(express.static('public'));

import path from 'path';

import multer from 'multer';

// Multer will upload the video file to its temporary folder
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './path/to/file');
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.set('view engine', 'ejs');

app.get('/upload', (req, res) => {
  console.log('upload');
  res.render('upload', { videoCID, videoCID1, videoCID2 });
});

app.post('/upload', upload.single('video'), async (req, res) => {
  const file = req.file;
  const fileName = file.originalname;
  const filePath = path.join('./path/to/file', fileName);

  // Move the uploaded file to the destination folder
  fs.rename(file.path, filePath, async (err) => {
    if (err) throw err;
    console.log('File uploaded successfully to ', filePath);
    //    res.send('File uploaded successfully!' + filePath);
    const path = filePath;

    const cid = await uploadVideo(path);
    console.log('CID:', cid);

    videoCID = cid;
    res.render('upload', { videoCID, videoCID1, videoCID2 });
  });
});

async function deleteFile(cid) {
  const url = `${process.env.PORTAL_URL}/s5/delete/${cid}`;
  console.log('Deleting file with CID:', cid);
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
      },
    });
    console.log('File deleted successfully:', cid);
    console.log('File deleted response:', response);
    //    res.send('File deleted successfully:' + cid);
  } catch (err) {
    console.error('Error deleting file:', err);
    //    res.send('Error deleting file:' + cid);
  }
}

app.post('/delete', async (req, res) => {
  await deleteFile(videoCID);
  await deleteFile(videoCID1);
  await deleteFile(videoCID2);

  videoCID = videoCID1 = videoCID2 = '';
  res.render('upload', { videoCID, videoCID1, videoCID2 });
});

app.post('/transcode', async (req, res) => {
  // Create gRPC client
  const client = new transcodeProto.TranscodeService(
    process.env.TRANSCODER_URL,
    credentials.createInsecure()
  );

  console.log(
    `/transcode ${process.env.PORTAL_URL}/s5/blob/${videoCID}?mediaType=video%2Fmp4`
  );

  // Define request object
  const request = {
    url: `${process.env.PORTAL_URL}/s5/blob/${videoCID}?mediaType=video%2Fmp4`,
  };

  // Send the gRPC request to transcode the video
  client.Transcode(request, (err, response) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Transcode response:', response);
    }
  });
});

app.get('/refresh', async (req, res) => {
  // Create gRPC client
  const client = new transcodeProto.TranscodeService(
    process.env.TRANSCODER_URL,
    credentials.createInsecure()
  );

  // Define request object
  const request = {
    resolution: '1080p',
  };

  // Send the gRPC request to retrieve CID of the video
  client.GetCID(request, (err, response) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('1080p CID response:', response);
      videoCID1 = response.cid;

      res.render('upload', { videoCID, videoCID1, videoCID2 });
    }
  });

  // Define request object
  const request2 = {
    resolution: '720p',
  };

  // Send the gRPC request to retrieve CID of the video
  client.GetCID(request2, (err, response) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('720p CID response:', response);
      videoCID2 = response.cid;

      res.render('upload', { videoCID, videoCID1, videoCID2 });
    }
  });
});

app.listen(3001, '0.0.0.0', () => console.log('Server running on port 3001'));
