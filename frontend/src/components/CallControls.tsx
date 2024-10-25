import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

interface CallControlsProps {
  localMicOn: boolean;
  localWebcamOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  handleHangout: () => void;
}

const CallControls: React.FC<CallControlsProps> = ({
  localMicOn,
  localWebcamOn,
  toggleMic,
  toggleCamera,
  handleHangout,
}) => {
  return (
    <View
      style={{
        height: 100,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        backgroundColor: 'black',
        opacity: 0.7,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
      }}>
      <TouchableOpacity onPress={toggleMic}>
        <Icon
          name={localMicOn ? 'microphone' : 'microphone-slash'}
          size={30}
          color="white"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleCamera}>
        <Feather
          name={localWebcamOn ? 'camera' : 'camera-off'}
          size={30}
          color="white"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleHangout}
        style={{
          backgroundColor: 'red',
          borderRadius: 50,
          paddingVertical: 10,
          paddingHorizontal: 15,
        }}>
        <Icon name="phone" size={30} color="white" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {}}>
        <Icon name="ellipsis-v" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default CallControls;
