import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert,Modal, TextInput  } from 'react-native';
import Slider from '@react-native-community/slider';
import ColorCircle from '../components/ColorCircle';
import Icon from 'react-native-vector-icons/Ionicons';

// Sunucu API adresi
const API_URL = 'http://192.168.136.124:5001/api/led/color'; // ✅ Must match Flask IP


const HomeScreen = ({ navigation }) => {
  const [red, setRed] = useState(0);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const [brightness, setBrightness] = useState(1);
  const [lightOn, setLightOn] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Mod oluşturma modalı için state'ler
  const [modModalVisible, setModModalVisible] = useState(false);
  const [modName, setModName] = useState('');
  const [modRoom, setModRoom] = useState(null);
  const [modRoomModalVisible, setModRoomModalVisible] = useState(false);

  // Oda numaraları
  const rooms = [
    { id: 1, name: 'Oda 1' },
    { id: 2, name: 'Oda 2' },
    { id: 3, name: 'Oda 3' },
    { id: 4, name: 'Oda 4' },
  ];

  const color = `rgb(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(blue * 255)})`;

  // ✅ Send LED update to server
  const sendLEDUpdate = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: lightOn ? 'on' : 'off',
          red: Math.round(red * 255),
          green: Math.round(green * 255),
          blue: Math.round(blue * 255),
          brightness,
          room: selectedRoom, // Oda numarasını ekle
        }),
      });

      if (!response.ok) throw new Error('Sunucuya gönderim başarısız');
      console.log('LED güncellendi:', await response.json());

    } catch (error) {
      console.error('LED gönderimi sırasında hata:', error);
      Alert.alert('Hata', 'Işık durumu sunucuya gönderilemedi.');
    }
  };
  
  // Mod oluşturma fonksiyonu
  const createMode = async (modName, roomId) => {
    try {
      // Yeni mod bilgisi
      const newMode = {
        id: modName.toLowerCase().replace(/\s+/g, '_'),
        name: modName,
        color: color,
        room: roomId,
        brightness: brightness,
      };
      
      // AsyncStorage veya başka bir depolama mekanizması kullanarak kaydetme işlemi eklenmeli
      // Şimdilik modları global bir değişkende tutmak için basit bir yaklaşım kullanıyoruz
      
      // Önceki ekrana dönüş yaparken veriyi geçiriyoruz
      navigation.navigate('Modlar', { newMode });
      
      Alert.alert('Başarılı', `"${modName}" modu oluşturuldu`);
    } catch (error) {
      console.error('Mod oluşturma sırasında hata:', error);
      Alert.alert('Hata', 'Mod oluşturulamadı.');
    }
  };

  // Oda seçme modalını aç
  const openRoomModal = (action) => {
    setActionType(action);
    setModalVisible(true);
  };

  // Oda seçildiğinde işlemi gerçekleştir
  const handleRoomSelect = async (roomId) => {
    setSelectedRoom(roomId);
    setModalVisible(false);
    
    const newLightState = actionType === 'on';
    setLightOn(newLightState);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: newLightState ? 'on' : 'off',
          red: Math.round(red * 255),
          green: Math.round(green * 255),
          blue: Math.round(blue * 255),
          brightness,
          room: roomId, // Oda numarasını ekle
        }),
      });

      if (!response.ok) throw new Error('Toggle failed');
      console.log('Light state updated:', await response.json());
      
      // Kullanıcıya bilgi ver
      Alert.alert(
        'Başarılı', 
        `${rooms.find(r => r.id === roomId).name} için ışık ${newLightState ? 'açıldı' : 'kapatıldı'}.`
      );

    } catch (error) {
      console.error('Toggle error:', error);
      Alert.alert('Hata', 'Işık açma/kapama işlemi başarısız.');
    }
  };

  // ✅ Real-time updates with debounce
  useEffect(() => {
    if (!lightOn || !selectedRoom) return;

    const timeoutId = setTimeout(() => {
      sendLEDUpdate();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [red, green, blue, brightness, lightOn, selectedRoom]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Akıllı Aydınlatma</Text>
      <ColorCircle color={color} brightness={brightness} />

      {/* RGB Sliders */}
      {[
        { label: 'Kırmızı', value: red, color: 'red', onChange: setRed },
        { label: 'Yeşil', value: green, color: 'green', onChange: setGreen },
        { label: 'Mavi', value: blue, color: 'blue', onChange: setBlue },
      ].map((slider, index) => (
        <View key={index} style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{slider.label}</Text>
          <Slider
            style={styles.slider}
            value={slider.value}
            minimumValue={0}
            maximumValue={1}
            minimumTrackTintColor={slider.color}
            onValueChange={slider.onChange}
          />
          <Text style={styles.sliderValue}>{Math.round(slider.value * 255)}</Text>
        </View>
      ))}

      {/* Brightness Slider */}

      <View style={styles.brightnessRow}>
        <Icon name="sunny" size={24} color="#fff" />
        <Slider
          style={{ flex: 1 }}
          value={brightness}
          minimumValue={0}
          maximumValue={1}
          minimumTrackTintColor="#fff"
          onValueChange={setBrightness}
        />
        <Text style={styles.sliderValue}>{Math.round(brightness * 100)}%</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#4caf50' }]}
          onPress={() => openRoomModal('on')}
        >
          <Text style={styles.buttonText}>Aç</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#f44336' }]}
          onPress={() => openRoomModal('off')}
        >
          <Text style={styles.buttonText}>Kapat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#2196f3' }]}
          onPress={() => navigation.navigate('Modlar')}
        >
          <Text style={styles.buttonText}>Modlar</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.mediumButton, { backgroundColor: 'orange' }]}
        onPress={() => setModModalVisible(true)}
      >
        <Text style={styles.mediumButtonText}>Mod Oluştur</Text>
      </TouchableOpacity>

      {/* Oda Seçme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Oda Seçin
            </Text>
            
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomButton}
                onPress={() => handleRoomSelect(room.id)}
              >
                <Text style={styles.roomButtonText}>{room.name}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Mod Oluşturma Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modModalVisible}
        onRequestClose={() => setModModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Mod Oluştur
            </Text>
            
            <Text style={styles.inputLabel}>Mod Adı:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Mod adını girin"
              placeholderTextColor="#999"
              value={modName}
              onChangeText={setModName}
            />
            
            <TouchableOpacity
              style={styles.selectRoomButton}
              onPress={() => {
                setModRoomModalVisible(true);
                setModModalVisible(false);
              }}
            >
              <Text style={styles.selectRoomButtonText}>
                {modRoom ? `Seçili Oda: ${rooms.find(r => r.id === modRoom).name}` : 'Oda Seç'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
                onPress={() => {
                  if (modName.trim() === '') {
                    Alert.alert('Uyarı', 'Lütfen mod adı girin');
                    return;
                  }
                  
                  if (!modRoom) {
                    Alert.alert('Uyarı', 'Lütfen oda seçin');
                    return;
                  }
                  
                  createMode(modName, modRoom);
                  setModModalVisible(false);
                  setModName('');
                  setModRoom(null);
                }}
              >
                <Text style={styles.actionButtonText}>Kaydet</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                onPress={() => {
                  setModModalVisible(false);
                  setModName('');
                  setModRoom(null);
                }}
              >
                <Text style={styles.actionButtonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Mod için Oda Seçme Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modRoomModalVisible}
        onRequestClose={() => {
          setModRoomModalVisible(false);
          setModModalVisible(true);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Mod İçin Oda Seçin
            </Text>
            
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomButton}
                onPress={() => {
                  setModRoom(room.id);
                  setModRoomModalVisible(false);
                  setModModalVisible(true);
                }}
              >
                <Text style={styles.roomButtonText}>{room.name}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModRoomModalVisible(false);
                setModModalVisible(true);
              }}
            >
              <Text style={styles.cancelButtonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#484A47',
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    marginTop: 20,
    textAlign: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sliderLabel: {
    color: '#fff',
    width: 60,
    fontSize: 16,
  },
  slider: {
    flex: 1,
  },
  sliderValue: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    minWidth: 30,
  },
  brightnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mediumButton: {
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 40,
  },
  mediumButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  roomButton: {
    width: '100%',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  roomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#555',
    width: '80%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  // Mod oluşturma stilleri
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#333',
    width: '100%',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    marginBottom: 15,
  },
  selectRoomButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  selectRoomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    margin: 5,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});