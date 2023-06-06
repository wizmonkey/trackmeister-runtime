import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, StatusBar} from 'react-native';
import * as Location from 'expo-location';
import themeContext, { useTheme } from "../config/themeContext";
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { LocationProvider } from '../config/LocationProvider';
import { Searchbar } from 'react-native-paper';

const Tester = () => {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [nearestStops, setNearestStops] = useState([]);

  const navigation = useNavigation();
  const toBusStops = () => {
    navigation.navigate("Stops");
  };

  useEffect(() => {
    getLocationPermissionAndFetchData();
  }, []);

  const getLocationPermissionAndFetchData = async () => {
    const granted = await LocationProvider();
    if (granted) {
      getUserLocation();
    }
  };

  const getUserLocation = async () => {
    try {
      const { coords } = await Location.getCurrentPositionAsync();

      const stops = await fetchNearestStops(coords.latitude, coords.longitude);
      setNearestStops(stops);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };

  //get nearest bus stops from db
  const fetchNearestStops = async (latitude, longitude) => {
    try {
      const db = getDatabase();
      const busStopsRef = ref(db, 'busStops');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(busStopsRef, resolve, reject);
      });

      if (snapshot.exists()) {
        const stops = snapshot.val();

        if (!stops) {
          console.log('No stops found');
          return [];
        }

        const stopsWithDistance = Object.values(stops).map(stop => {
          const { latitude: stopLatitude, longitude: stopLongitude, ...otherProps } = stop;

          // Calculate the distance using the Haversine formula
          const distance = calculateDistance(latitude, longitude, stopLatitude, stopLongitude);

          return {
            latitude: stopLatitude,
            longitude: stopLongitude,
            distance,
            ...otherProps
          };
        });

        // Sort the stops based on distance in ascending order
        const sortedStops = stopsWithDistance.sort((a, b) => a.distance - b.distance);

        return sortedStops;
      } else {
        console.log('No stops found');
        return [];
      }
    } catch (error) {
      console.error('Error fetching nearest stops:', error);
      return [];
    }
  };
  const handleBusStopSelect = (busStop) => {
    navigation.navigate('Map', { busStop });
  };

  //calculate distance from user location
  const calculateDistance = (userLatitude, userLongitude, stopLatitude, stopLongitude) => {
    const toRadians = (value) => (value * Math.PI) / 180; // Helper function to convert degrees to radians
  
    const earthRadius = 6371; // Radius of the Earth in kilometers
  
    const phi1 = toRadians(userLatitude);
    const phi2 = toRadians(stopLatitude);
    const deltaPhi = toRadians(stopLatitude - userLatitude);
    const deltaLambda = toRadians(stopLongitude - userLongitude);
  
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = earthRadius * c;
  
    // Format distance with leading zero and two decimal places
    const formattedDistance = distance.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  
    return formattedDistance;
  };

  const renderStopItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleBusStopSelect(item)} style={styles.textContainer}>
      <View style={{ flex: 0.2 }}>
        <Text style={[styles.itemDistance, styles.text]}>{item.distance} km {'\n'}</Text>
      </View>
      <View style={{ flex: 0.8, justifyContent: 'flex-start' }}>
        <Text style={[styles.itemName, styles.text]}>{item.stopName}</Text>
        <Text style={[styles.itemAddress, styles.text]}>{item.address}</Text>
      </View>
      <TouchableOpacity>
        <MaterialCommunityIcons style={styles.icon} size={20} name="crosshairs-gps" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.topText}>Nearest Stops</Text>
      </View>
      <View style={styles.listContainer}>
        {nearestStops.length > 0 ? (
          <>
            <FlatList
              data={nearestStops}
              renderItem={renderStopItem}
              keyExtractor={(item) => item.stopId.toString()}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <Text style={styles.text}>Loading nearest stops...</Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 0.01,
      backgroundColor: theme.background,
      color: theme.color,
      borderWidth: 1,
      borderColor: theme.highlight,
      elevation: 5,
      borderRadius: 10,
      marginHorizontal: 1
    },
    topText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 10,
      color: theme.accent,
      marginHorizontal: '3%',
    },
    textContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      flex: 1,
      borderColor: theme.highlight,
    },
    text: {
      color: theme.color,
    },
    listContainer: {
      borderRadius: 10,
      marginTop: 10,
      marginBottom: 20,
      marginHorizontal: '3%',
      backgroundColor: theme.background,
      overflow: 'hidden'
    },
    itemName: {
      fontSize: 16,
      marginTop: 10,
      fontWeight: 'bold',
    },
    itemAddress: {
      fontSize: 14,
    },
    itemDistance: {
      fontSize: 12,
      marginTop: 2,
      fontWeight: '600',
    },
    icon: {
      flex: 0.075
    }
  });

export default Tester;
