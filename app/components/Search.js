import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { Searchbar } from 'react-native-paper';
import themeContext from "../config/themeContext";
import { useNavigation } from '@react-navigation/native';

const db = getDatabase();

export default function Search() {
  const theme = useContext(themeContext);
  const styles = getStyles(theme);
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  const toLanding = () => {
    navigation.navigate('Landing');
  };

  useEffect(() => {
    setIsMounted(true);

    const starCountRef = ref(db, 'busStops');
    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();
      setData(data);
      setFilteredData(data);
      setIsLoading(false);
    });

    return () => {
      setIsMounted(false);
      off(starCountRef);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      const filteredResults = data.filter((item) => {
        return (
          item.stopName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.address.toLowerCase().includes(searchText.toLowerCase())
        );
      });
      setFilteredData(filteredResults);
    }
  }, [searchText]);

  const renderItem = ({ item }) => {
    return (
      <View style={{ padding: 10 }}>
        <Text style={styles.title}>{item.stopName}</Text>
        <Text style={styles.text}>{item.address}</Text>
      </View>
    );
  };

  return ( 
    <View style={styles.container}>
      {isLoading ? null : (
        <View style={styles.searchContainer}>
          <Searchbar
            style={styles.searchBar}
            onChangeText={(text) => setSearchText(text)}
            value={searchText}
            placeholder="Search for stops"
            placeholderTextColor={theme.subtext}
            iconColor={theme.subtext}
            icon="arrow-left"
            onIconPress={toLanding}
          />
        </View>
      )}
      {(isLoading ? null :  (
      <View style={styles.headerContainer}>
      <Text style={styles.header}>Bus Stops</Text>
    </View>
      ))}
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={theme.accent} />
      ) : (
        <FlatList
          style={styles.list}
          data={Object.values(filteredData)}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 10
    },
    title: {
      fontWeight: 'bold',
      color: theme.color
    },
    searchBar: {
      backgroundColor: theme.barColor,
    },
    searchContainer:  {
      alignItems: 'center',
      marginHorizontal: '5%',
      marginBottom: '5%',
      borderRadius: 30,
      elevation: 10,
    },
    list: {
      marginHorizontal: '5%',
      color: theme.color
    },
    headerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderColor: theme.color
    },
    header: {
      fontWeight: 'bold',
      fontSize: 16,
      color: theme.accent,
      marginBottom: 10
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: theme.subtext
    },
  });
