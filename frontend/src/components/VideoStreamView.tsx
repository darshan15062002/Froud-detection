import React from 'react';
import {MediaStream, RTCView} from 'react-native-webrtc';

interface VideoStreamViewProps {
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  localWebcamOn: boolean;
}

const VideoStreamView: React.FC<VideoStreamViewProps> = ({
  stream,
  remoteStream,
  localWebcamOn,
}) => {
  return (
    <>
      {!remoteStream && localWebcamOn && stream && (
        <RTCView
          style={{flex: 1}}
          streamURL={stream?.toURL()}
          objectFit={'cover'}
          mirror={true}
        />
      )}
      {remoteStream && (
        <>
          <RTCView
            streamURL={remoteStream?.toURL()}
            style={{flex: 1}}
            objectFit={'cover'}
            mirror={true}
          />
          {stream && localWebcamOn && (
            <RTCView
              streamURL={stream?.toURL()}
              style={{
                height: 150,
                width: 100,
                position: 'absolute',
                top: 20,
                right: 20,
              }}
              objectFit="cover"
              mirror={true}
            />
          )}
        </>
      )}
    </>
  );
};

export default VideoStreamView;
