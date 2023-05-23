import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import SearchBar from '../components/SearchBar';
import themeContext from "../config/themeContext";
import * as Location from 'expo-location';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const Home = () => {
  const theme = useContext(themeContext);
  const styles = getStyles(theme);
  const [nearestStops, setNearestStops] = useState([]);
  const [showStops, setShowStops] = useState(2);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }
  
      const { coords } = await Location.getCurrentPositionAsync();
  
      const stops = await fetchNearestStops(coords.latitude, coords.longitude);
      setNearestStops(stops);
    } catch (error) {
      console.error('Error getting user location:', error);
    }
  };
  
  useEffect(() => {
    getUserLocation();
  }, []);
  

  const fetchNearestStops = async (latitude, longitude) => {
    try {
      const db = getDatabase();
      const dbRef = ref(db, 'busStops');
      const snapshot = await new Promise((resolve, reject) => {
        onValue(dbRef, resolve, reject);
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
        const nearestStops = stopsWithDistance.sort((a, b) => a.distance - b.distance);

        return nearestStops;
      } else {
        console.log('No stops found');
        return [];
      }
    } catch (error) {
      console.error('Error fetching nearest stops:', error);
      return [];
    }
  };

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

    // Convert distance to meters and round to two decimal places
    return Math.round(distance * 1000);
  };

  const renderStopItem = ({ item }) => (
    <TouchableOpacity style={styles.textContainer}>
      <Text style={[styles.itemName, styles.text]}>{item.stopName}</Text>
      <Text style={[styles.itemAddress, styles.text]}>{item.address}</Text>
      <Text style={[styles.itemDistance, styles.text]}>{item.distance} m away</Text>
    </TouchableOpacity>
  );

  const handleShowMore = () => {
    if (showStops < 5) {
      setShowStops(showStops + 1);
    } else {
      setIsCollapsed(false);
    }
  };

  const handleCollapse = () => {
    setIsCollapsed(true);
  };

  const handleRefresh = () => {
    getUserLocation();
  };

  return (
    <View style={styles.container}>
      <SearchBar />
      <Text style={styles.topText}>Nearby Stops</Text>
      <View style={styles.listContainer}>
        {nearestStops.length > 0 ? (
          <>
            <FlatList
              data={nearestStops.slice(0, showStops)}
              renderItem={renderStopItem}
              keyExtractor={(item) => item.stopId.toString()}
              contentContainerStyle={styles.listContent}
              initialNumToRender={2}
            />
            {showStops < 6 && isCollapsed ? (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.showButton} onPress={handleShowMore}>
                  <Text style={styles.buttonText}>Show More</Text>
                </TouchableOpacity>
                <View style={styles.separator} />
                <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
                  <Text style={styles.buttonText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.collapseButton} onPress={handleCollapse}>
                <Text style={styles.buttonText}>Collapse</Text>
              </TouchableOpacity>
            )}
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
      flex: 1,
      backgroundColor: theme.background,
      color: theme.color,
    },
    topText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 10,
      color: theme.color,
      marginHorizontal: '5%',
    },
    text: {
      color: theme.color,
    },
    listContainer: {
      borderRadius: 10,
      marginTop: 10,
      marginBottom: 20,
      marginHorizontal: '5%',
      backgroundColor: theme.background,
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
    textContainer: {
      borderWidth: 1,
      paddingBottom: 10,
      marginBottom: 10,
      flex: 1,
      borderRadius: 10,
      paddingHorizontal: 15,
      borderColor: theme.highlight,
      borderRadius: 10,
    },
    listContent: {
      paddingBottom: 10,
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingHorizontal: '5%',
    },
    showButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: theme.primary,
      borderRadius: 5,
    },
    collapseButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: theme.warning,
      borderRadius: 5,
    },
    refreshButton: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      backgroundColor: theme.secondary,
      borderRadius: 5,
    },
    buttonText: {
      color: theme.buttonText,
      fontWeight: 'bold',
    },
    separator: {
      width: 1,
      height: '100%',
      backgroundColor: theme.separator,
    },
  });

export default Home;
