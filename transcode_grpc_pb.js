// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var transcode_pb = require('./transcode_pb.js');

function serialize_transcode_TranscodeRequest(arg) {
  if (!(arg instanceof transcode_pb.TranscodeRequest)) {
    throw new Error('Expected argument of type transcode.TranscodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_transcode_TranscodeRequest(buffer_arg) {
  return transcode_pb.TranscodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_transcode_TranscodeResponse(arg) {
  if (!(arg instanceof transcode_pb.TranscodeResponse)) {
    throw new Error('Expected argument of type transcode.TranscodeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_transcode_TranscodeResponse(buffer_arg) {
  return transcode_pb.TranscodeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var TranscodeServiceService = exports.TranscodeServiceService = {
  transcode: {
    path: '/transcode.TranscodeService/Transcode',
    requestStream: false,
    responseStream: false,
    requestType: transcode_pb.TranscodeRequest,
    responseType: transcode_pb.TranscodeResponse,
    requestSerialize: serialize_transcode_TranscodeRequest,
    requestDeserialize: deserialize_transcode_TranscodeRequest,
    responseSerialize: serialize_transcode_TranscodeResponse,
    responseDeserialize: deserialize_transcode_TranscodeResponse,
  },
};

exports.TranscodeServiceClient = grpc.makeGenericClientConstructor(TranscodeServiceService);
