import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import IconButton from '../components/IconButton';
import Icon from 'react-native-vector-icons/Ionicons';

const API_URL = 'http://192.168.136.124:5001/api/led/color'; // HomeScreen ile aynı API endpoint'i kullanıyoruz

const ModesScreen = ({ navigation, route}) => {
  const [modes, setModes] = useState([
    
    { id: 'meal', name: 'Yemek', color: 'rgb(255, 200, 100)' },
    { id: 'sleep', name: 'Uyku', color: 'rgb(100, 100, 255)' },
    { id: 'study', name: 'Ders', color: 'rgb(255, 255, 100)' },
  ]);

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    if (route.params?.newMode) {
      setModes(prev => [...prev, route.params.newMode]);
      // Eğer tekrar ekleme önlemek istiyorsanız, bu parametreyi silmek için bir yol bulunabilir.
      // Örneğin, Home ekranından yeni bir mod gönderilirken bunu kontrol edebilirsiniz.
    }
  });
  return unsubscribe;
}, [navigation, route.params]);
/*
    useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (navigation.getParam('newMode')) {
        setModes(prev => [...prev, navigation.getParam('newMode')]);
        navigation.setParams({ newMode: null }); // Tekrar ekleme önlemek için
      }
    });
    return unsubscribe;
  }, [navigation]);*/

  const rooms = [
    { id: 1, name: 'Oda 1' },
    { id: 2, name: 'Oda 2' },
    { id: 3, name: 'Oda 3' },
    { id: 4, name: 'Oda 4' },
  ];

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);

    if (mode.room) {
      // Önceden tanımlı odası varsa direkt uygula
      handleRoomSelectDirect(mode, mode.room);
    } else {
      // Oda seçilmemişse modal aç
      setModalVisible(true);
    }
  };

const handleRoomSelectDirect = async (mode, roomId) => {
  console.log(`${mode.name} modu ${roomId} numaralı odada doğrudan uygulanıyor. Renk: ${mode.color}`);

  const rgbValues = mode.color.match(/\d+/g);
  if (!rgbValues || rgbValues.length < 3) {
    Alert.alert("Hata", "Geçersiz renk formatı.");
    return;
  }

  const [red, green, blue] = rgbValues.map(Number);

  // Varsayılan olarak brightness'i 1 olarak ayarla
  const brightness = 1; // Buraya gerekli bir değer atanabilir
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'on',
          red,
          green,
          blue,
          brightness,
          room: roomId,
        }),
      });

      if (!response.ok) throw new Error('Sunucuya gönderim başarısız');

      const result = await response.json();
      const roomName = rooms.find(r => r.id === roomId)?.name || `Oda ${roomId}`;
      Alert.alert('Başarılı', `${mode.name} modu ${roomName} için uygulandı`);
      navigation.goBack();
    } catch (error) {
      console.error('Mod gönderimi sırasında hata:', error);
      Alert.alert('Hata', 'Mod bilgisi gönderilemedi.');
    }
  };

  const handleRoomSelect = (roomId) => {
    setModalVisible(false);
    if (selectedMode) {
      handleRoomSelectDirect(selectedMode, roomId);
    }
  };

  return (
    <View style={styles.container}>
      <IconButton icon="arrow-back" label="Anasayfa" onPress={() => navigation.navigate('Home')} />
      <Text style={styles.title}>Hazır Aydınlatma Modları</Text>

      <View style={styles.modesContainer}>
        {modes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.modeCard, { backgroundColor: mode.color }]}
            onPress={() => handleModeSelect(mode)}
          >
            <Text style={styles.modeText}>{mode.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedMode ? `${selectedMode.name} Modu İçin Oda Seçin` : 'Oda Seçin'}
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
    </View>
  );
};

export default ModesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#484A47',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  modesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  modeCard: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#fff',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  modeText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
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
});