import React, {useState} from 'react';
import {MediaStream, RTCView} from 'react-native-webrtc';
import TransactionActionModal from './TransactionActionModal';
import {verifyTransaction} from '../hook/api';
import {TouchableOpacity} from 'react-native';

interface VideoStreamViewProps {
  stream: MediaStream | null;
  remoteStream: MediaStream | null;
  localWebcamOn: boolean;
}

const VideoStreamView: React.FC<VideoStreamViewProps> = ({
  stream,
  remoteStream,
  localWebcamOn,
  transactionId,
}) => {
  console.log(transactionId, 'da');

  const [modalVisible, setModalVisible] = useState(false);
  const handleAccept = async () => {
    console.log('Transaction Accepted');
    setModalVisible(false);
    const result = await verifyTransaction(transactionId, isVerified === true);
  };

  const handleReject = async () => {
    console.log('Transaction Rejected');
    setModalVisible(false);
    const result = await verifyTransaction(transactionId, isVerified === false);
  };
  return (
    <>
      {transactionId && (
        <TransactionActionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAccept={handleAccept}
          onReject={handleReject}
          // transaction={transaction}
        />
      )}
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
          <TouchableOpacity
            style={{backgroundColor: 'red', padding: 5}}
            onPress={() => setModalVisible(true)}>
            Approve
          </TouchableOpacity>
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
