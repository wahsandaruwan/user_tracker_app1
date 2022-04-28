import React, { useState, useEffect, useRef } from "react"
import { StyleSheet, View, Dimensions, PermissionsAndroid, Platform, LogBox } from "react-native"
import MapView, { Marker } from "react-native-maps"
import { getPreciseDistance } from "geolib"
import Geolocation from "react-native-geolocation-service"
import retroMapStyle from "./retroMap.json"
import trainAllLocations from "./trainLoc.json"
// Default location : 6.882822000943358, 79.88679574443385

export default function App() {
  // Ignore warnings
  LogBox.ignoreLogs([
    "exported from 'deprecated-react-native-prop-types'.",
  ])

  // Delta values
  const LATITUDE_DELTA = 0.0009
  const LONGITUDE_DELTA = 0.0005

  // Vehicle breaking
  let vehicleBreak = false

  // Map reference
  const mapRef = useRef(null)

  // User location state
  const [userLocation, setUserLocation] = useState({
    latitude: 6.8649,
    longitude: 79.8997,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA
  })

  // Train location state
  const [trainLocation, setTrainLocation] = useState({
    latitude: 6.8857354543513045,
    longitude: 79.88082094080386,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA
  })

  // Railway gates states
  const [railwayGates, setRailwayGates] = useState([
    {
      latitude: 6.88250166633171,
      longitude: 79.88297447562218,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA
    }
  ])

  // Get user location in every 3 seconds
  useEffect(() => {
    let interval = setInterval(() => {
      getCurrentLocation()
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Update train location in every 3 seconds
  useEffect(() => {
    let count = 0
    let interval = setInterval(() => {
      setTrainCurrentLocation(count)
      count++
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Get current location
  const getCurrentLocation = async () => {
    const locationGranted = await locationPermission()
    if (locationGranted && !vehicleBreak) {
      // Get position
      Geolocation.getCurrentPosition(
        (position) => {
          // Set new user location
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA
          }
          setUserLocation(newLocation)

          // Focus map to new user location
          if (mapRef.current) {
            mapRef.current.animateToRegion(newLocation, 3000)
          }

          // Calculate distance
          calculateDistance(position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.log(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      )
    }
  }

  // Set current location of the train
  const setTrainCurrentLocation = (count) => {
    console.log(trainAllLocations[count])
    if (trainAllLocations.length > 0) {
      setTrainLocation(trainAllLocations[count])
    }
    else {
      setTrainLocation({
        latitude: 6.8817813289909004,
        longitude: 79.88294412296925,
        latitudeDelta: 0.0009,
        longitudeDelta: 0.0005
      })
    }
  }

  // Grant device location access permission
  const locationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true
      }
    }
  }

  // Calculate the distance between 2 points
  const calculateDistance = (userLat, userLong) => {
    const distance = getPreciseDistance(
      { latitude: userLat, longitude: userLong },
      { latitude: railwayGates[0].latitude, longitude: railwayGates[0].longitude },
    )
    console.log(distance)

    // For alerts
    alertMessages(distance)
  }

  // Display alert messages during the route
  const alertMessages = (distance) => {
    if (distance <= 50 && distance > 35) {
      alert(
        `Train is coming slow down!\n\n 50 more meters to the railway gate.`
      )
    }
    else if (distance <= 35 && distance > 20) {
      alert(
        `Train is getting close!\n\n 25 more meters to the railway gate.\n\n Sending signal to the automatic breaking system....`
      )
    }
    else if (distance < 20) {
      vehicleBreak = true
      alert(
        `Vehicle stopped!`
      )
    }
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        ref={mapRef}
        customMapStyle={retroMapStyle}
        initialRegion={userLocation}
      >
        <Marker coordinate={userLocation} title="You" />
        <Marker coordinate={railwayGates[0]} pinColor="gold" />
        <Marker coordinate={trainLocation} pinColor="green" />
      </MapView>
    </View>
  )
}

// Custom styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height
  },
});
